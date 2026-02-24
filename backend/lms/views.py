from django.utils import timezone
from django.db.models import Avg, Count, Q
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model

from .models import (
    Course, Module, Lesson, Enrollment, LessonProgress,
    Test, Question, AnswerOption, TestAttempt, StudentAnswer,
    Certificate, Announcement, GoetheExam, GoetheExamRequest,
    LessonRequest,
)
from .serializers import (
    RegisterSerializer, UserSerializer, CourseSummarySerializer,
    CourseSerializer, ModuleWithProgressSerializer, LessonSerializer,
    EnrollmentSerializer, LessonProgressSerializer, UpdateProgressSerializer,
    TestStudentSerializer, TestSerializer, SubmitTestSerializer,
    TestAttemptSerializer, GradeAnswerSerializer, CertificateSerializer,
    AnnouncementSerializer, StudentAnswerSerializer,
    GoetheExamSerializer, GoetheExamRequestSerializer,
    LessonRequestSerializer,
)
from .permissions import IsAdmin, IsInstructor, IsInstructorOrAdmin, IsStudent

User = get_user_model()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {'error': 'Your account has been suspended.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_active = timezone.now().date()
        user.save(update_fields=['last_active'])

        tokens = get_tokens(user)
        return Response({
            'user':   UserSerializer(user).data,
            'tokens': tokens,
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh = request.data.get('refresh')
            token   = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


class MeView(APIView):
    """Get or update the currently logged-in user"""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Student Dashboard ────────────────────────────────────────────────────────

class StudentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        user        = request.user
        enrollments = Enrollment.objects.filter(student=user, is_active=True).select_related('course')
        attempts    = TestAttempt.objects.filter(student=user).order_by('-started_at')[:5]
        certs       = Certificate.objects.filter(student=user, status='issued')

        exam_days_left = None
        if user.exam_date:
            delta = (user.exam_date - timezone.now().date()).days
            exam_days_left = max(delta, 0)

        return Response({
            'user':           UserSerializer(user).data,
            'enrollments':    EnrollmentSerializer(enrollments, many=True).data,
            'recent_scores':  TestAttemptSerializer(attempts, many=True).data,
            'certificates':   CertificateSerializer(certs, many=True).data,
            'streak':         user.current_streak,
            'exam_days_left': exam_days_left,
        })


# ─── Courses ──────────────────────────────────────────────────────────────────

class CourseListView(generics.ListAPIView):
    """Public list of published courses"""
    serializer_class   = CourseSummarySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs    = Course.objects.filter(status='published')
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        return qs


class CourseDetailView(generics.RetrieveAPIView):
    serializer_class   = CourseSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Course.objects.filter(status='published')


class CourseModulesView(APIView):
    """Returns modules + lessons with student progress baked in"""
    def get(self, request, course_id):
        course  = Course.objects.get(pk=course_id)
        modules = Module.objects.filter(course=course).prefetch_related('lessons')
        data    = ModuleWithProgressSerializer(
            modules, many=True, context={'request': request}
        ).data
        return Response(data)


class EnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request, course_id):
        course = Course.objects.get(pk=course_id, status='published')
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course,
            defaults={'is_active': True}
        )
        if not created and not enrollment.is_active:
            enrollment.is_active = True
            enrollment.save()
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ─── Lessons ──────────────────────────────────────────────────────────────────

class LessonDetailView(generics.RetrieveAPIView):
    serializer_class   = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset           = Lesson.objects.all()


class UpdateLessonProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        serializer = UpdateProgressSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        lesson_id = serializer.validated_data['lesson_id']
        watch_pct = serializer.validated_data['watch_pct']
        lesson    = Lesson.objects.get(pk=lesson_id)

        progress, _ = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
        )
        progress.watch_pct = max(progress.watch_pct, watch_pct)

        if watch_pct >= lesson.completion_pct and not progress.completed:
            progress.completed    = True
            progress.completed_at = timezone.now()

        progress.save()
        return Response(LessonProgressSerializer(progress).data)


# ─── Tests ────────────────────────────────────────────────────────────────────

class TestDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, test_id):
        test = Test.objects.prefetch_related('questions__options').get(pk=test_id)
        if request.user.role == 'student':
            return Response(TestStudentSerializer(test).data)
        return Response(TestSerializer(test).data)


class SubmitTestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        serializer = SubmitTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        test = Test.objects.prefetch_related('questions__options').get(
            pk=serializer.validated_data['test_id']
        )
        answers    = serializer.validated_data['answers']
        time_taken = serializer.validated_data['time_taken']

        attempt_count = TestAttempt.objects.filter(
            student=request.user, test=test
        ).count()
        if attempt_count >= test.max_attempts:
            return Response(
                {'error': 'Maximum attempts reached.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        attempt = TestAttempt.objects.create(
            student=request.user,
            test=test,
            time_taken=time_taken,
        )

        total_points  = 0
        earned_points = 0

        for ans in answers:
            question       = Question.objects.get(pk=ans['question_id'])
            total_points  += question.points
            student_answer = StudentAnswer(attempt=attempt, question=question)

            if question.type in ['multiple_choice', 'true_false']:
                option_id = ans.get('option_id')
                if option_id:
                    option = AnswerOption.objects.get(pk=option_id)
                    student_answer.selected_option = option
                    student_answer.is_correct      = option.is_correct
                    if option.is_correct:
                        student_answer.points_awarded = question.points
                        earned_points += question.points

            elif question.type == 'fill_blank':
                text    = ans.get('text_answer', '').strip().lower()
                correct = [o.text.strip().lower() for o in question.options.filter(is_correct=True)]
                student_answer.text_answer = text
                if text in correct:
                    student_answer.is_correct     = True
                    student_answer.points_awarded = question.points
                    earned_points += question.points

            elif question.type == 'short_answer':
                student_answer.text_answer = ans.get('text_answer', '')

            student_answer.save()

        score  = round((earned_points / total_points * 100), 2) if total_points > 0 else 0
        passed = score >= test.passing_score

        attempt.score        = score
        attempt.passed       = passed
        attempt.completed_at = timezone.now()
        attempt.save()

        if passed and test.course:
            Certificate.objects.get_or_create(
                student=request.user,
                course=test.course,
                defaults={
                    'score':   score,
                    'attempt': attempt,
                    'status':  'pending',
                }
            )

        return Response(TestAttemptSerializer(attempt).data)


# ─── Instructor: Dashboard & Students ─────────────────────────────────────────

class InstructorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        courses = Course.objects.filter(instructor=request.user)

        student_ids = Enrollment.objects.filter(
            course__in=courses, is_active=True
        ).values_list('student_id', flat=True).distinct()

        pending = StudentAnswer.objects.filter(
            question__type__in=['short_answer', 'audio'],
            graded_by__isnull=True,
            attempt__test__course__in=courses,
        ).count()

        avg = TestAttempt.objects.filter(
            test__course__in=courses
        ).aggregate(avg=Avg('score'))['avg'] or 0

        enr_qs    = Enrollment.objects.filter(course__in=courses, is_active=True)
        enr_total = enr_qs.count()
        enr_done  = enr_qs.filter(completed=True).count()
        completion_rate = round((enr_done / enr_total * 100), 1) if enr_total else 0

        return Response({
            'courses':         CourseSummarySerializer(courses, many=True).data,
            'total_students':  len(student_ids),
            'pending_grading': pending,
            'avg_readiness':   round(avg, 1),
            'completion_rate': round(completion_rate, 1),
        })


class InstructorStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        courses     = Course.objects.filter(instructor=request.user)
        enrollments = Enrollment.objects.filter(
            course__in=courses, is_active=True
        ).select_related('student', 'course')

        students = []
        seen     = set()
        for enr in enrollments:
            s = enr.student
            if s.id in seen:
                continue
            seen.add(s.id)

            last_attempt = TestAttempt.objects.filter(
                student=s, test__course__in=courses
            ).order_by('-started_at').first()

            students.append({
                'id':          s.id,
                'name':        s.full_name,
                'email':       s.email,
                'level':       s.level,
                'progress':    100 if enr.completed else 0,
                'readiness':   round(float(last_attempt.score), 1) if last_attempt else 0,
                'last_active': s.last_active,
                'status':      'active' if s.is_active else 'inactive',
            })

        return Response(students)


class PendingGradingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        courses = Course.objects.filter(instructor=request.user)
        answers = StudentAnswer.objects.filter(
            question__type__in=['short_answer', 'audio'],
            graded_by__isnull=True,
            attempt__test__course__in=courses,
        ).select_related('attempt__student', 'question', 'attempt__test')

        data = []
        for ans in answers:
            data.append({
                'answer_id': ans.id,
                'student':   ans.attempt.student.full_name,
                'task':      ans.attempt.test.title,
                'type':      ans.question.type,
                'level':     ans.attempt.test.level,
                'submitted': ans.attempt.started_at,
                'response':  ans.text_answer,
            })
        return Response(data)


class GradeAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def patch(self, request, answer_id):
        answer     = StudentAnswer.objects.get(pk=answer_id)
        serializer = GradeAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        answer.points_awarded = serializer.validated_data['points_awarded']
        answer.feedback       = serializer.validated_data['feedback']
        answer.graded_by      = request.user
        answer.graded_at      = timezone.now()
        answer.is_correct     = answer.points_awarded > 0
        answer.save()

        attempt      = answer.attempt
        total_points = attempt.test.total_points
        earned       = sum(float(a.points_awarded) for a in attempt.answers.all())
        attempt.score  = round((earned / total_points * 100), 2) if total_points else 0
        attempt.passed = attempt.score >= attempt.test.passing_score
        attempt.save()

        return Response({'message': 'Answer graded.', 'new_score': attempt.score})


# ─── Instructor: Weak Areas ───────────────────────────────────────────────────

class InstructorWeakAreasView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        from collections import defaultdict

        courses = Course.objects.filter(instructor=request.user)
        answers = StudentAnswer.objects.filter(
            attempt__test__course__in=courses,
            question__topic__isnull=False,
        ).exclude(question__topic='').select_related('question', 'attempt')

        topic_data = defaultdict(lambda: {'total': 0, 'correct': 0, 'students': set()})

        for ans in answers:
            topic = ans.question.topic
            topic_data[topic]['total']   += 1
            topic_data[topic]['students'].add(ans.attempt.student_id)
            if ans.is_correct:
                topic_data[topic]['correct'] += 1

        results = []
        for topic, d in topic_data.items():
            pct = round((d['correct'] / d['total']) * 100) if d['total'] else 0
            results.append({
                'area':     topic,
                'avgScore': pct,
                'students': len(d['students']),
            })

        results.sort(key=lambda x: x['avgScore'])
        return Response(results[:8])


# ─── Instructor: Course Management ────────────────────────────────────────────

class InstructorCourseListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        courses = Course.objects.filter(instructor=request.user).order_by('-created_at')
        return Response(CourseSummarySerializer(courses, many=True).data)

    def post(self, request):
        course = Course.objects.create(
            title=request.data.get('title', 'Untitled Course'),
            description=request.data.get('description', ''),
            level=request.data.get('level', 'B1'),
            price=request.data.get('price', 0),
            status='draft',
            instructor=request.user,
        )
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class InstructorCourseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def _get_course(self, request, course_id):
        return Course.objects.get(pk=course_id, instructor=request.user)

    def get(self, request, course_id):
        return Response(CourseSerializer(self._get_course(request, course_id)).data)

    def patch(self, request, course_id):
        course = self._get_course(request, course_id)
        for field in ['title', 'description', 'level', 'price', 'thumbnail']:
            if field in request.data:
                setattr(course, field, request.data[field])
        course.save()
        return Response(CourseSerializer(course).data)

    def delete(self, request, course_id):
        self._get_course(request, course_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstructorCourseSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def post(self, request, course_id):
        course = Course.objects.get(pk=course_id, instructor=request.user)
        if course.status == 'published':
            return Response(
                {'error': 'Course is already published.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        course.status = 'review'
        course.save()
        return Response({'message': 'Course submitted for review.', 'status': 'review'})


# ─── Instructor: Module Management ────────────────────────────────────────────

class InstructorModuleListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request, course_id):
        Course.objects.get(pk=course_id, instructor=request.user)
        modules = Module.objects.filter(course_id=course_id).prefetch_related('lessons').order_by('order')
        return Response(ModuleWithProgressSerializer(modules, many=True, context={'request': request}).data)

    def post(self, request, course_id):
        course     = Course.objects.get(pk=course_id, instructor=request.user)
        last_order = (
            Module.objects.filter(course=course)
            .order_by('-order')
            .values_list('order', flat=True)
            .first()
        )
        module = Module.objects.create(
            course=course,
            title=request.data.get('title', 'New Module'),
            description=request.data.get('description', ''),
            order=(last_order or 0) + 1,
        )
        return Response({
            'id':          module.id,
            'title':       module.title,
            'description': module.description,
            'order':       module.order,
            'lessons':     [],
        }, status=status.HTTP_201_CREATED)


class InstructorModuleDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def _get_module(self, request, module_id):
        module = Module.objects.get(pk=module_id)
        Course.objects.get(pk=module.course_id, instructor=request.user)
        return module

    def patch(self, request, module_id):
        module = self._get_module(request, module_id)
        for field in ['title', 'description', 'order']:
            if field in request.data:
                setattr(module, field, request.data[field])
        module.save()
        return Response({
            'id':          module.id,
            'title':       module.title,
            'description': module.description,
            'order':       module.order,
        })

    def delete(self, request, module_id):
        self._get_module(request, module_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Instructor: Lesson Management ────────────────────────────────────────────

class InstructorLessonListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def post(self, request, module_id):
        module = Module.objects.get(pk=module_id)
        Course.objects.get(pk=module.course_id, instructor=request.user)
        last_order = (
            Lesson.objects.filter(module=module)
            .order_by('-order')
            .values_list('order', flat=True)
            .first()
        )
        lesson = Lesson.objects.create(
            module=module,
            title=request.data.get('title', 'New Lesson'),
            description=request.data.get('description', ''),
            video_url=request.data.get('video_url', ''),
            duration=request.data.get('duration', 0),
            transcript=request.data.get('transcript', ''),
            is_preview=request.data.get('is_preview', False),
            completion_pct=request.data.get('completion_pct', 80),
            order=(last_order or 0) + 1,
        )
        if 'video_file' in request.FILES:
            lesson.video_file = request.FILES['video_file']
            lesson.save()
        return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)


class InstructorLessonDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def _get_lesson(self, request, lesson_id):
        lesson = Lesson.objects.select_related('module').get(pk=lesson_id)
        Course.objects.get(pk=lesson.module.course_id, instructor=request.user)
        return lesson

    def patch(self, request, lesson_id):
        lesson = self._get_lesson(request, lesson_id)
        for field in ['title', 'description', 'video_url', 'duration',
                      'transcript', 'is_preview', 'completion_pct', 'order']:
            if field in request.data:
                setattr(lesson, field, request.data[field])
        if 'video_file' in request.FILES:
            lesson.video_file = request.FILES['video_file']
        lesson.save()
        return Response(LessonSerializer(lesson).data)

    def delete(self, request, lesson_id):
        self._get_lesson(request, lesson_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Instructor: Lesson Requests ──────────────────────────────────────────────

class InstructorLessonRequestView(APIView):
    """
    GET   /api/instructor/lesson-requests/          — list requests assigned to this instructor
    PATCH /api/instructor/lesson-requests/<pk>/     — confirm / reject + add zoom link & note
    """
    permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]

    def get(self, request):
        qs = LessonRequest.objects.filter(
            instructor=request.user
        ).select_related('student')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(LessonRequestSerializer(qs, many=True).data)

    def patch(self, request, pk):
        try:
            req = LessonRequest.objects.get(pk=pk, instructor=request.user)
        except LessonRequest.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        allowed    = ['confirmed', 'rejected', 'completed']
        if new_status and new_status not in allowed:
            return Response(
                {'error': f'Status must be one of: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status:
            req.status = new_status
        if 'zoom_link' in request.data:
            req.zoom_link = request.data['zoom_link']
        if 'instructor_note' in request.data:
            req.instructor_note = request.data['instructor_note']

        req.save()
        return Response(LessonRequestSerializer(req).data)


# ─── Student: Lesson Requests ─────────────────────────────────────────────────

class StudentLessonRequestView(APIView):
    """
    GET  /api/student/lesson-requests/  — student views their own requests
    POST /api/student/lesson-requests/  — student submits a new request
    """
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        qs = LessonRequest.objects.filter(student=request.user)
        return Response(LessonRequestSerializer(qs, many=True).data)

    def post(self, request):
        serializer = LessonRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Auto-assign to the instructor of the student's first active enrollment
        enrollment = (
            Enrollment.objects
            .filter(student=request.user, is_active=True)
            .select_related('course__instructor')
            .first()
        )
        instructor = enrollment.course.instructor if enrollment else None

        req = serializer.save(student=request.user, instructor=instructor)
        return Response(LessonRequestSerializer(req).data, status=status.HTTP_201_CREATED)


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all()
        role  = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)


class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        return Response(UserSerializer(User.objects.get(pk=user_id)).data)

    def patch(self, request, user_id):
        user       = User.objects.get(pk=user_id)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, user_id):
        User.objects.get(pk=user_id).delete()
        return Response(status=204)


class AdminSuspendUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        user           = User.objects.get(pk=user_id)
        user.is_active = not user.is_active
        user.save()
        action = 'activated' if user.is_active else 'suspended'
        return Response({'message': f'User {action} successfully.'})


class AdminCourseListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        courses = Course.objects.all().select_related('instructor')
        return Response(CourseSummarySerializer(courses, many=True).data)


class AdminCourseReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, course_id):
        course = Course.objects.get(pk=course_id)
        action = request.data.get('action')
        if action == 'approve':
            course.status = 'published'
            course.save()
            return Response({'message': 'Course published.'})
        elif action == 'reject':
            course.status = 'draft'
            course.save()
            return Response({'message': 'Course sent back to draft.'})
        return Response({'error': 'Action must be approve or reject.'}, status=400)


class AdminCertificateListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        certs = Certificate.objects.filter(
            status=request.query_params.get('status', 'pending')
        ).select_related('student', 'course')
        return Response(CertificateSerializer(certs, many=True).data)


class AdminIssueCertificateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, cert_id):
        cert           = Certificate.objects.get(pk=cert_id)
        cert.status    = 'issued'
        cert.issued_by = request.user
        cert.issued_at = timezone.now()
        cert.save()
        return Response(CertificateSerializer(cert).data)


class AdminRevokeCertificateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, cert_id):
        cert               = Certificate.objects.get(pk=cert_id)
        cert.status        = 'revoked'
        cert.revoked_at    = timezone.now()
        cert.revoke_reason = request.data.get('reason', '')
        cert.save()
        return Response({'message': 'Certificate revoked.'})


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            'total_users':        User.objects.count(),
            'total_students':     User.objects.filter(role='student').count(),
            'total_instructors':  User.objects.filter(role='instructor').count(),
            'total_courses':      Course.objects.count(),
            'published_courses':  Course.objects.filter(status='published').count(),
            'pending_courses':    Course.objects.filter(status='review').count(),
            'total_enrollments':  Enrollment.objects.filter(is_active=True).count(),
            'total_certificates': Certificate.objects.filter(status='issued').count(),
            'pending_certs':      Certificate.objects.filter(status='pending').count(),
        })


class AdminAnnouncementView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(AnnouncementSerializer(Announcement.objects.all(), many=True).data)

    def post(self, request):
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sent_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ─── Placement Test ───────────────────────────────────────────────────────────

class PlacementTestView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        test = Test.objects.filter(is_placement=True).first()
        if not test:
            return Response({'error': 'No placement test found.'}, status=404)
        return Response(TestStudentSerializer(test).data)


# ─── Goethe: Public Exam List ─────────────────────────────────────────────────

class GoetheExamListView(APIView):
    """
    GET /api/goethe/exams/
    Public. Optional ?level=B2 filter.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs    = GoetheExam.objects.filter(is_active=True)
        level = request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        return Response(GoetheExamSerializer(qs, many=True).data)


# ─── Goethe: Requests (student creates / instructor & admin list) ─────────────

class GoetheRequestView(APIView):
    """
    GET  /api/goethe/requests/  — role-scoped list
    POST /api/goethe/requests/  — student submits a new request
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'student':
            qs = GoetheExamRequest.objects.filter(
                student=user
            ).select_related('exam', 'student')

        elif user.role == 'instructor':
            student_ids = Enrollment.objects.filter(
                course__instructor=user, is_active=True
            ).values_list('student_id', flat=True).distinct()

            qs = GoetheExamRequest.objects.filter(
                student_id__in=student_ids,
                status='pending_instructor',
            ).select_related('exam', 'student')

        elif user.role == 'admin':
            qs = GoetheExamRequest.objects.all()

        else:
            return Response([], status=status.HTTP_200_OK)

        return Response(GoetheExamRequestSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can submit exam requests.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GoetheExamRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        exam = serializer.validated_data['exam']
        if GoetheExamRequest.objects.filter(student=request.user, exam=exam).exists():
            return Response(
                {'error': 'You have already submitted a request for this exam.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req = serializer.save(student=request.user)
        return Response(
            GoetheExamRequestSerializer(req).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Goethe: Request Action (instructor forwards / admin approves-denies) ─────

class GoetheRequestActionView(APIView):
    """
    PATCH /api/goethe/requests/<request_id>/action/
    Instructor → action: "forward"
    Admin      → action: "approve" | "deny"
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, request_id):
        user   = request.user
        action = request.data.get('action')
        note   = request.data.get('note', '')

        try:
            req = GoetheExamRequest.objects.select_related('exam', 'student').get(pk=request_id)
        except GoetheExamRequest.DoesNotExist:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'instructor':
            if req.status != 'pending_instructor':
                return Response(
                    {'error': 'This request is no longer pending instructor review.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if action != 'forward':
                return Response(
                    {'error': 'Instructors can only use action: forward.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            req.status          = 'pending_admin'
            req.instructor      = user
            req.instructor_note = note
            req.save()
            return Response(GoetheExamRequestSerializer(req).data)

        elif user.role == 'admin':
            if req.status != 'pending_admin':
                return Response(
                    {'error': 'This request is not pending admin approval.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if action not in ('approve', 'deny'):
                return Response(
                    {'error': 'Admin action must be approve or deny.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            req.status     = 'approved' if action == 'approve' else 'denied'
            req.admin_note = note
            req.save()
            return Response(GoetheExamRequestSerializer(req).data)

        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)


# ─── Goethe: Admin Exam Management ───────────────────────────────────────────

class GoetheAdminExamView(APIView):
    """
    GET  /api/goethe/admin/exams/  — list all exams
    POST /api/goethe/admin/exams/  — create an exam
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(GoetheExamSerializer(GoetheExam.objects.all(), many=True).data)

    def post(self, request):
        serializer = GoetheExamSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                GoetheExamSerializer(serializer.save()).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoetheAdminExamDetailView(APIView):
    """
    PATCH  /api/goethe/admin/exams/<exam_id>/  — update
    DELETE /api/goethe/admin/exams/<exam_id>/  — delete
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, exam_id):
        exam       = GoetheExam.objects.get(pk=exam_id)
        serializer = GoetheExamSerializer(exam, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, exam_id):
        GoetheExam.objects.get(pk=exam_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)