from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# ─── User Manager ─────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role',         'admin')
        extra_fields.setdefault('is_staff',     True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


# ─── User ─────────────────────────────────────────────────────────────────────

class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('student',    'Student'),
        ('instructor', 'Instructor'),
        ('admin',      'Admin'),
    ]

    LEVEL_CHOICES = [
        ('A1', 'A1'), ('A2', 'A2'),
        ('B1', 'B1'), ('B2', 'B2'),
        ('C1', 'C1'), ('C2', 'C2'),
    ]

    email       = models.EmailField(unique=True)
    first_name  = models.CharField(max_length=100)
    last_name   = models.CharField(max_length=100)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    level       = models.CharField(max_length=2,  choices=LEVEL_CHOICES, blank=True, null=True)
    phone       = models.CharField(max_length=30,  blank=True)
    country     = models.CharField(max_length=100, blank=True)
    city        = models.CharField(max_length=100, blank=True)
    profession  = models.CharField(max_length=150, blank=True)
    bio         = models.TextField(blank=True)
    avatar      = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Learning goals
    target_level  = models.CharField(max_length=2, choices=LEVEL_CHOICES, blank=True, null=True)
    target_exam   = models.CharField(max_length=100, blank=True)
    exam_date     = models.DateField(blank=True, null=True)
    weekly_goal   = models.PositiveSmallIntegerField(default=5)
    is_relocating = models.BooleanField(default=False)
    destination   = models.CharField(max_length=150, blank=True)

    # Streak tracking
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active    = models.DateField(blank=True, null=True)

    # Django required fields
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


# ─── Course ───────────────────────────────────────────────────────────────────

class Course(models.Model):

    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('review',    'In Review'),
        ('published', 'Published'),
        ('archived',  'Archived'),
    ]

    LEVEL_CHOICES = [
        ('A1', 'A1'), ('A2', 'A2'),
        ('B1', 'B1'), ('B2', 'B2'),
        ('C1', 'C1'), ('C2', 'C2'),
    ]

    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='courses')
    level       = models.CharField(max_length=2, choices=LEVEL_CHOICES)
    thumbnail   = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    price       = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.level})'

    @property
    def student_count(self):
        return self.enrollments.filter(is_active=True).count()

    @property
    def lesson_count(self):
        return Lesson.objects.filter(module__course=self).count()


# ─── Module ───────────────────────────────────────────────────────────────────

class Module(models.Model):
    course      = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order       = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.course.title} — {self.title}'


# ─── Lesson ───────────────────────────────────────────────────────────────────

class Lesson(models.Model):
    module         = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title          = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    video_url      = models.URLField(blank=True)
    video_file     = models.FileField(upload_to='videos/', blank=True, null=True)
    duration       = models.PositiveIntegerField(default=0, help_text='Duration in seconds')
    transcript     = models.TextField(blank=True)
    order          = models.PositiveIntegerField(default=0)
    completion_pct = models.PositiveSmallIntegerField(default=80, help_text='% watched to mark complete')
    is_preview     = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.module.title} — {self.title}'


# ─── Enrollment ───────────────────────────────────────────────────────────────

class Enrollment(models.Model):
    student      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at  = models.DateTimeField(auto_now_add=True)
    is_active    = models.BooleanField(default=True)
    completed    = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f'{self.student.full_name} → {self.course.title}'

    @property
    def completion_percentage(self):
        total = Lesson.objects.filter(module__course=self.course).count()
        if total == 0:
            return 0
        done = LessonProgress.objects.filter(
            student=self.student,
            lesson__module__course=self.course,
            completed=True
        ).count()
        return round((done / total) * 100)


# ─── Lesson Progress ──────────────────────────────────────────────────────────

class LessonProgress(models.Model):
    student      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson       = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    completed    = models.BooleanField(default=False)
    watch_pct    = models.PositiveSmallIntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    last_watched = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f'{self.student.full_name} — {self.lesson.title} ({self.watch_pct}%)'


# ─── Test ─────────────────────────────────────────────────────────────────────

class Test(models.Model):
    module        = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='tests', blank=True, null=True)
    course        = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tests', blank=True, null=True)
    title         = models.CharField(max_length=200)
    description   = models.TextField(blank=True)
    level         = models.CharField(max_length=2, blank=True)
    time_limit    = models.PositiveIntegerField(default=30, help_text='Minutes')
    passing_score = models.PositiveSmallIntegerField(default=70, help_text='Percentage')
    max_attempts  = models.PositiveSmallIntegerField(default=2)
    shuffle_q     = models.BooleanField(default=False)
    shuffle_a     = models.BooleanField(default=False)
    show_answers  = models.BooleanField(default=True)
    is_placement  = models.BooleanField(default=False)
    created_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tests')
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def total_points(self):
        return self.questions.aggregate(total=models.Sum('points'))['total'] or 0


# ─── Question ─────────────────────────────────────────────────────────────────

class Question(models.Model):

    TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('fill_blank',      'Fill in the Blank'),
        ('true_false',      'True / False'),
        ('short_answer',    'Short Answer'),
        ('audio',           'Audio'),
    ]

    topic       = models.CharField(max_length=100, blank=True, default='')
    test        = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    type        = models.CharField(max_length=30, choices=TYPE_CHOICES, default='multiple_choice')
    text        = models.TextField()
    points      = models.PositiveSmallIntegerField(default=1)
    level       = models.CharField(max_length=2, blank=True)
    explanation = models.TextField(blank=True)
    audio_file  = models.FileField(upload_to='audio/', blank=True, null=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'Q{self.order}: {self.text[:60]}'


# ─── Answer Option ────────────────────────────────────────────────────────────

class AnswerOption(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text       = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order      = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{"[CORRECT] " if self.is_correct else ""}{self.text[:60]}'


# ─── Test Attempt ─────────────────────────────────────────────────────────────

class TestAttempt(models.Model):
    student      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_attempts')
    test         = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='attempts')
    score        = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed       = models.BooleanField(default=False)
    started_at   = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    time_taken   = models.PositiveIntegerField(default=0, help_text='Seconds')

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.student.full_name} — {self.test.title} — {self.score}%'


# ─── Student Answer ───────────────────────────────────────────────────────────

class StudentAnswer(models.Model):
    attempt         = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question        = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(AnswerOption, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer     = models.TextField(blank=True)
    is_correct      = models.BooleanField(default=False)
    points_awarded  = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    graded_by       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_answers')
    graded_at       = models.DateTimeField(blank=True, null=True)
    feedback        = models.TextField(blank=True)

    def __str__(self):
        return f'{self.attempt.student.full_name} — Q{self.question.order}'


# ─── Certificate ──────────────────────────────────────────────────────────────

class Certificate(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('issued',  'Issued'),
        ('revoked', 'Revoked'),
    ]

    student       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    course        = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    attempt       = models.ForeignKey(TestAttempt, on_delete=models.SET_NULL, null=True, blank=True)
    score         = models.DecimalField(max_digits=5, decimal_places=2)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    issued_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_certs')
    issued_at     = models.DateTimeField(blank=True, null=True)
    revoked_at    = models.DateTimeField(blank=True, null=True)
    revoke_reason = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        ordering        = ['-created_at']

    def __str__(self):
        return f'{self.student.full_name} — {self.course.title} — {self.status}'


# ─── Announcement ─────────────────────────────────────────────────────────────

class Announcement(models.Model):

    AUDIENCE_CHOICES = [
        ('all',         'All Users'),
        ('students',    'Students Only'),
        ('instructors', 'Instructors Only'),
    ]

    title    = models.CharField(max_length=200)
    message  = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    sent_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='announcements')
    sent_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f'{self.title} → {self.audience}'


# ─── Goethe Exam ──────────────────────────────────────────────────────────────

class GoetheExam(models.Model):

    LEVEL_CHOICES = [
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'),
        ('B2', 'B2'), ('C1', 'C1'), ('C2', 'C2'),
    ]

    level           = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    audience        = models.CharField(max_length=50, default='Adults')
    location        = models.CharField(max_length=100)
    exam_date_start = models.DateField()
    exam_date_end   = models.DateField(null=True, blank=True)
    reg_open        = models.DateField()
    reg_close       = models.DateField()
    price_full      = models.DecimalField(max_digits=10, decimal_places=2)
    price_reduced   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_module    = models.CharField(max_length=150, blank=True, default='')
    is_active       = models.BooleanField(default=True)
    notes           = models.TextField(blank=True, default='')
    created_at      = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['exam_date_start']

    def __str__(self):
        return f'Goethe {self.level} — {self.location} — {self.exam_date_start}'

    @property
    def booking_status(self):
        today = timezone.now().date()
        if today > self.reg_close:
            return 'expired'
        if today < self.reg_open:
            return 'upcoming'
        return 'open'


# ─── Goethe Exam Request ──────────────────────────────────────────────────────

class GoetheExamRequest(models.Model):

    STATUS_CHOICES = [
        ('pending_instructor', 'Pending Instructor Review'),
        ('pending_admin',      'Pending Admin Approval'),
        ('approved',           'Approved'),
        ('denied',             'Denied'),
    ]

    student         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goethe_requests')
    exam            = models.ForeignKey(GoetheExam, on_delete=models.CASCADE, related_name='requests')
    instructor      = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='goethe_forwarded',
        help_text='Set automatically when instructor forwards the request',
    )
    status          = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_instructor')
    student_note    = models.TextField(blank=True, default='')
    instructor_note = models.TextField(blank=True, default='')
    admin_note      = models.TextField(blank=True, default='')
    created_at      = models.DateTimeField(default=timezone.now)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering        = ['-created_at']
        unique_together = [('student', 'exam')]

    def __str__(self):
        return f'{self.student.full_name} → {self.exam} [{self.status}]'


# ─── Lesson Request ───────────────────────────────────────────────────────────

class LessonRequest(models.Model):

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected',  'Rejected'),
        ('completed', 'Completed'),
    ]

    student          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_requests')
    instructor       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_lesson_requests',
    )
    topic            = models.CharField(max_length=300)
    preferred_date   = models.DateField()
    preferred_time   = models.TimeField()
    alt_date         = models.DateField(null=True, blank=True)
    alt_time         = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    student_message  = models.TextField(blank=True)
    instructor_note  = models.TextField(blank=True)
    zoom_link        = models.URLField(blank=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at       = models.DateTimeField(default=timezone.now)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.full_name} → {self.topic} [{self.status}]'