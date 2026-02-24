from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Allow access only to students"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsInstructor(BasePermission):
    """Allow access only to instructors"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'instructor'


class IsAdmin(BasePermission):
    """Allow access only to admins"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsInstructorOrAdmin(BasePermission):
    """Allow access to instructors and admins"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['instructor', 'admin']
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access if the user owns the object or is an admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj == request.user or getattr(obj, 'student', None) == request.user