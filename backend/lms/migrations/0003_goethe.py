"""
Goethe migration — RENAME this file to match your next migration number.

Steps:
  1. Find your latest migration:  ls lms/migrations/
  2. Rename this file to:         lms/migrations/0002_goethe.py  (or 0003_, etc.)
  3. Update the dependencies line below to match your actual last migration name.
  4. Run: python manage.py migrate
"""

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        # !! CHANGE '0001_initial' to your actual last migration name !!
        ('lms', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GoetheExam',
            fields=[
                ('id',              models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('level',           models.CharField(max_length=10, choices=[
                                        ('A1','A1'),('A2','A2'),('B1','B1'),
                                        ('B2','B2'),('C1','C1'),('C2','C2'),
                                    ])),
                ('audience',        models.CharField(max_length=50, default='Adults')),
                ('location',        models.CharField(max_length=100)),
                ('exam_date_start', models.DateField()),
                ('exam_date_end',   models.DateField(null=True, blank=True)),
                ('reg_open',        models.DateField()),
                ('reg_close',       models.DateField()),
                ('price_full',      models.DecimalField(max_digits=10, decimal_places=2)),
                ('price_reduced',   models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)),
                ('price_module',    models.CharField(max_length=150, blank=True, default='')),
                ('is_active',       models.BooleanField(default=True)),
                ('notes',           models.TextField(blank=True, default='')),
                ('created_at',      models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={'ordering': ['exam_date_start']},
        ),
        migrations.CreateModel(
            name='GoetheExamRequest',
            fields=[
                ('id',              models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('status',          models.CharField(max_length=30, default='pending_instructor', choices=[
                                        ('pending_instructor', 'Pending Instructor Review'),
                                        ('pending_admin',      'Pending Admin Approval'),
                                        ('approved',           'Approved'),
                                        ('denied',             'Denied'),
                                    ])),
                ('student_note',    models.TextField(blank=True, default='')),
                ('instructor_note', models.TextField(blank=True, default='')),
                ('admin_note',      models.TextField(blank=True, default='')),
                ('created_at',      models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at',      models.DateTimeField(auto_now=True)),
                ('exam',            models.ForeignKey(
                                        to='lms.GoetheExam',
                                        on_delete=django.db.models.deletion.CASCADE,
                                        related_name='requests',
                                    )),
                ('student',         models.ForeignKey(
                                        to='lms.User',
                                        on_delete=django.db.models.deletion.CASCADE,
                                        related_name='goethe_requests',
                                    )),
                ('instructor',      models.ForeignKey(
                                        to='lms.User',
                                        on_delete=django.db.models.deletion.SET_NULL,
                                        null=True, blank=True,
                                        related_name='goethe_forwarded',
                                    )),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('student', 'exam')},
            },
        ),
    ]