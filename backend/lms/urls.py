from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [

    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/',      views.RegisterView.as_view(),  name='register'),
    path('auth/login/',         views.LoginView.as_view(),     name='login'),
    path('auth/logout/',        views.LogoutView.as_view(),    name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),
    path('auth/me/',            views.MeView.as_view(),        name='me'),

    # ── Student ───────────────────────────────────────────────────────────────
    path('student/dashboard/',         views.StudentDashboardView.as_view(),      name='student_dashboard'),
    path('student/progress/',          views.UpdateLessonProgressView.as_view(),  name='update_progress'),
    path('student/lesson-requests/',   views.StudentLessonRequestView.as_view(),  name='student_lesson_requests'),

    # ── Courses ───────────────────────────────────────────────────────────────
    path('courses/',                         views.CourseListView.as_view(),    name='course_list'),
    path('courses/<int:pk>/',                views.CourseDetailView.as_view(),  name='course_detail'),
    path('courses/<int:course_id>/modules/', views.CourseModulesView.as_view(), name='course_modules'),
    path('courses/<int:course_id>/enroll/',  views.EnrollView.as_view(),        name='enroll'),

    # ── Lessons ───────────────────────────────────────────────────────────────
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson_detail'),

    # ── Tests ─────────────────────────────────────────────────────────────────
    path('tests/<int:test_id>/', views.TestDetailView.as_view(),   name='test_detail'),
    path('tests/submit/',        views.SubmitTestView.as_view(),    name='submit_test'),
    path('placement-test/',      views.PlacementTestView.as_view(), name='placement_test'),

    # ── Instructor ────────────────────────────────────────────────────────────
    path('instructor/dashboard/',               views.InstructorDashboardView.as_view(),     name='instructor_dashboard'),
    path('instructor/students/',                views.InstructorStudentsView.as_view(),      name='instructor_students'),
    path('instructor/grading/',                 views.PendingGradingView.as_view(),          name='pending_grading'),
    path('instructor/grading/<int:answer_id>/', views.GradeAnswerView.as_view(),             name='grade_answer'),
    path('instructor/weak-areas/',              views.InstructorWeakAreasView.as_view(),     name='instructor_weak_areas'),
    path('instructor/lesson-requests/',         views.InstructorLessonRequestView.as_view(), name='instructor_lesson_requests'),
    path('instructor/lesson-requests/<int:pk>/',views.InstructorLessonRequestView.as_view(), name='instructor_lesson_request_detail'),

    # ── Instructor: Course Management ─────────────────────────────────────────
    path('instructor/courses/',                          views.InstructorCourseListView.as_view(),   name='instructor_course_list'),
    path('instructor/courses/<int:course_id>/',          views.InstructorCourseDetailView.as_view(), name='instructor_course_detail'),
    path('instructor/courses/<int:course_id>/submit/',   views.InstructorCourseSubmitView.as_view(), name='instructor_course_submit'),
    path('instructor/courses/<int:course_id>/modules/',  views.InstructorModuleListView.as_view(),   name='instructor_module_list'),
    path('instructor/modules/<int:module_id>/',          views.InstructorModuleDetailView.as_view(), name='instructor_module_detail'),
    path('instructor/modules/<int:module_id>/lessons/',  views.InstructorLessonListView.as_view(),   name='instructor_lesson_list'),
    path('instructor/lessons/<int:lesson_id>/',          views.InstructorLessonDetailView.as_view(), name='instructor_lesson_detail'),

    # ── Goethe: Student & Instructor ──────────────────────────────────────────
    path('goethe/exams/',                            views.GoetheExamListView.as_view(),      name='goethe_exams'),
    path('goethe/requests/',                         views.GoetheRequestView.as_view(),       name='goethe_requests'),
    path('goethe/requests/<int:request_id>/action/', views.GoetheRequestActionView.as_view(), name='goethe_request_action'),

    # ── Goethe: Admin ─────────────────────────────────────────────────────────
    path('goethe/admin/exams/',              views.GoetheAdminExamView.as_view(),       name='goethe_admin_exams'),
    path('goethe/admin/exams/<int:exam_id>/',views.GoetheAdminExamDetailView.as_view(), name='goethe_admin_exam_detail'),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path('admin/stats/',                              views.AdminStatsView.as_view(),            name='admin_stats'),
    path('admin/users/',                              views.AdminUserListView.as_view(),          name='admin_users'),
    path('admin/users/<int:user_id>/',                views.AdminUserDetailView.as_view(),        name='admin_user_detail'),
    path('admin/users/<int:user_id>/suspend/',        views.AdminSuspendUserView.as_view(),       name='admin_suspend_user'),
    path('admin/courses/',                            views.AdminCourseListView.as_view(),        name='admin_courses'),
    path('admin/courses/<int:course_id>/review/',     views.AdminCourseReviewView.as_view(),      name='admin_course_review'),
    path('admin/certificates/',                       views.AdminCertificateListView.as_view(),   name='admin_certificates'),
    path('admin/certificates/<int:cert_id>/issue/',   views.AdminIssueCertificateView.as_view(),  name='admin_issue_cert'),
    path('admin/certificates/<int:cert_id>/revoke/',  views.AdminRevokeCertificateView.as_view(), name='admin_revoke_cert'),
    path('admin/announcements/',                      views.AdminAnnouncementView.as_view(),      name='admin_announcements'),
]