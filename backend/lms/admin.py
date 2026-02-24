from django.contrib import admin
from .models import (
    User, Course, Module, Lesson, Enrollment, LessonProgress,
    Test, Question, AnswerOption, TestAttempt, StudentAnswer,
    Certificate, Announcement, GoetheExam, GoetheExamRequest
)

@admin.register(GoetheExam)
class GoetheExamAdmin(admin.ModelAdmin):
    list_display = ['level', 'location', 'exam_date_start', 'reg_open', 'reg_close', 'price_full', 'price_reduced']
    list_filter = ['level']
    ordering = ['exam_date_start']

@admin.register(GoetheExamRequest)
class GoetheExamRequestAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'status', 'created_at']
    list_filter = ['status']
    ordering = ['-created_at']