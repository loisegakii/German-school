from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Course, Module, Lesson, Enrollment, LessonProgress,
    Test, Question, AnswerOption, TestAttempt, StudentAnswer,
    Certificate, Announcement, GoetheExam, GoetheExamRequest,
    LessonRequest,
)

User = get_user_model()


# ─── Auth & User ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'role', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'level', 'target_level', 'target_exam', 'exam_date',
            'phone', 'country', 'city', 'profession', 'bio', 'avatar',
            'weekly_goal', 'is_relocating', 'destination',
            'current_streak', 'longest_streak', 'last_active',
            'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'current_streak', 'longest_streak']


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight user info — used inside nested objects"""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email', 'role', 'level', 'avatar']


# ─── Course ───────────────────────────────────────────────────────────────────

class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnswerOption
        fields = ['id', 'text', 'is_correct', 'order']


class AnswerOptionStudentSerializer(serializers.ModelSerializer):
    """Hides is_correct from students"""
    class Meta:
        model  = AnswerOption
        fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = [
            'id', 'type', 'text', 'points', 'level',
            'explanation', 'audio_file', 'order', 'options',
        ]


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Hides explanation and correct answers from students during test"""
    options = AnswerOptionStudentSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ['id', 'type', 'text', 'points', 'level', 'audio_file', 'order', 'options']


class TestSerializer(serializers.ModelSerializer):
    questions    = QuestionSerializer(many=True, read_only=True)
    total_points = serializers.ReadOnlyField()

    class Meta:
        model  = Test
        fields = [
            'id', 'title', 'description', 'level',
            'time_limit', 'passing_score', 'max_attempts',
            'shuffle_q', 'shuffle_a', 'show_answers',
            'is_placement', 'total_points', 'questions', 'created_at',
        ]


class TestStudentSerializer(serializers.ModelSerializer):
    """Student-safe test — hides answers"""
    questions    = QuestionStudentSerializer(many=True, read_only=True)
    total_points = serializers.ReadOnlyField()

    class Meta:
        model  = Test
        fields = [
            'id', 'title', 'description', 'level',
            'time_limit', 'passing_score', 'max_attempts',
            'shuffle_q', 'shuffle_a', 'total_points', 'questions',
        ]


# ─── Lesson ───────────────────────────────────────────────────────────────────

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lesson
        fields = [
            'id', 'title', 'description', 'video_url', 'video_file',
            'duration', 'transcript', 'order', 'completion_pct',
            'is_preview', 'created_at',
        ]

    def _to_int(self, value, default):
        if value is None or value == '':
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    def validate_duration(self, value):
        v = self._to_int(value, 0)
        if v < 0:
            raise serializers.ValidationError('Duration cannot be negative.')
        return v

    def validate_completion_pct(self, value):
        v = self._to_int(value, 80)
        if not (50 <= v <= 100):
            raise serializers.ValidationError('Completion threshold must be between 50 and 100.')
        return v

    def validate_order(self, value):
        return self._to_int(value, 0)


# ─── Progress ─────────────────────────────────────────────────────────────────

class LessonWithProgressSerializer(serializers.ModelSerializer):
    completed = serializers.SerializerMethodField()
    watch_pct = serializers.SerializerMethodField()

    class Meta:
        model  = Lesson
        fields = [
            'id', 'title', 'description', 'video_url', 'duration',
            'order', 'completion_pct', 'is_preview', 'completed', 'watch_pct',
        ]

    def get_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return LessonProgress.objects.filter(
            student=request.user, lesson=obj, completed=True
        ).exists()

    def get_watch_pct(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        progress = LessonProgress.objects.filter(
            student=request.user, lesson=obj
        ).first()
        return progress.watch_pct if progress else 0


class ModuleSerializer(serializers.ModelSerializer):
    lessons      = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model  = Module
        fields = ['id', 'title', 'description', 'order', 'lessons', 'lesson_count']

    def get_lesson_count(self, obj):
        return obj.lessons.count()


class ModuleWithProgressSerializer(serializers.ModelSerializer):
    lessons = LessonWithProgressSerializer(many=True, read_only=True)

    class Meta:
        model  = Module
        fields = ['id', 'title', 'description', 'order', 'lessons']


class CourseSerializer(serializers.ModelSerializer):
    instructor    = UserSummarySerializer(read_only=True)
    modules       = ModuleSerializer(many=True, read_only=True)
    student_count = serializers.ReadOnlyField()
    lesson_count  = serializers.ReadOnlyField()

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'description', 'instructor', 'level',
            'thumbnail', 'status', 'price', 'student_count',
            'lesson_count', 'modules', 'created_at', 'updated_at',
        ]


class CourseSummarySerializer(serializers.ModelSerializer):
    """Lightweight — used in lists"""
    instructor    = UserSummarySerializer(read_only=True)
    student_count = serializers.ReadOnlyField()
    lesson_count  = serializers.ReadOnlyField()

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'description', 'instructor', 'level',
            'thumbnail', 'status', 'price', 'student_count', 'lesson_count',
        ]


# ─── Enrollment ───────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course                = CourseSummarySerializer(read_only=True)
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model  = Enrollment
        fields = [
            'id', 'course', 'enrolled_at', 'is_active',
            'completed', 'completed_at', 'completion_percentage',
        ]


# ─── Progress ─────────────────────────────────────────────────────────────────

class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LessonProgress
        fields = ['id', 'lesson', 'completed', 'watch_pct', 'completed_at', 'last_watched']


class UpdateProgressSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()
    watch_pct = serializers.IntegerField(min_value=0, max_value=100)


# ─── Test Attempt ─────────────────────────────────────────────────────────────

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StudentAnswer
        fields = [
            'id', 'question', 'selected_option', 'text_answer',
            'is_correct', 'points_awarded', 'feedback',
        ]


class TestAttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    student = UserSummarySerializer(read_only=True)

    class Meta:
        model  = TestAttempt
        fields = [
            'id', 'student', 'test', 'score', 'passed',
            'started_at', 'completed_at', 'time_taken', 'answers',
        ]


class SubmitTestSerializer(serializers.Serializer):
    test_id    = serializers.IntegerField()
    time_taken = serializers.IntegerField()
    answers    = serializers.ListField(child=serializers.DictField())


class GradeAnswerSerializer(serializers.Serializer):
    points_awarded = serializers.DecimalField(max_digits=4, decimal_places=2)
    feedback       = serializers.CharField(allow_blank=True)


# ─── Certificate ──────────────────────────────────────────────────────────────

class CertificateSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer(read_only=True)
    course  = CourseSummarySerializer(read_only=True)

    class Meta:
        model  = Certificate
        fields = [
            'id', 'student', 'course', 'score', 'status',
            'issued_at', 'created_at',
        ]


# ─── Announcement ─────────────────────────────────────────────────────────────

class AnnouncementSerializer(serializers.ModelSerializer):
    sent_by = UserSummarySerializer(read_only=True)

    class Meta:
        model  = Announcement
        fields = ['id', 'title', 'message', 'audience', 'sent_by', 'sent_at']


# ─── Dashboard payloads ───────────────────────────────────────────────────────

class StudentDashboardSerializer(serializers.Serializer):
    user           = UserSerializer()
    enrollments    = EnrollmentSerializer(many=True)
    recent_scores  = TestAttemptSerializer(many=True)
    certificates   = CertificateSerializer(many=True)
    streak         = serializers.IntegerField()
    exam_days_left = serializers.IntegerField(allow_null=True)


class InstructorDashboardSerializer(serializers.Serializer):
    courses         = CourseSummarySerializer(many=True)
    total_students  = serializers.IntegerField()
    pending_grading = serializers.IntegerField()
    avg_readiness   = serializers.FloatField()


# ─── Goethe ───────────────────────────────────────────────────────────────────

class GoetheExamSerializer(serializers.ModelSerializer):
    booking_status = serializers.ReadOnlyField()

    class Meta:
        model  = GoetheExam
        fields = [
            'id', 'level', 'audience', 'location',
            'exam_date_start', 'exam_date_end',
            'reg_open', 'reg_close',
            'price_full', 'price_reduced', 'price_module',
            'booking_status', 'is_active', 'notes', 'created_at',
        ]


class GoetheExamRequestSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer(read_only=True)
    exam    = GoetheExamSerializer(read_only=True)
    exam_id = serializers.PrimaryKeyRelatedField(
        queryset=GoetheExam.objects.filter(is_active=True),
        write_only=True,
        source='exam',
    )

    class Meta:
        model  = GoetheExamRequest
        fields = [
            'id', 'student', 'exam', 'exam_id',
            'status', 'student_note', 'instructor_note', 'admin_note',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'status',
            'instructor_note', 'admin_note',
            'created_at', 'updated_at',
        ]


# ─── Lesson Request ───────────────────────────────────────────────────────────

class LessonRequestSerializer(serializers.ModelSerializer):
    student_name  = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email',     read_only=True)

    class Meta:
        model  = LessonRequest
        fields = [
            'id', 'student', 'student_name', 'student_email', 'instructor',
            'topic', 'preferred_date', 'preferred_time',
            'alt_date', 'alt_time', 'duration_minutes',
            'student_message', 'instructor_note', 'zoom_link',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'instructor', 'status',
            'zoom_link', 'created_at', 'updated_at',
        ]