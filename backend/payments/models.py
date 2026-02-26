from django.db import models

class MpesaTransaction(models.Model):
    STATUS = [("pending","Pending"),("completed","Completed"),("failed","Failed"),("cancelled","Cancelled")]

    user                = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True)
    checkout_request_id = models.CharField(max_length=100, unique=True, db_index=True)
    merchant_request_id = models.CharField(max_length=100)
    phone               = models.CharField(max_length=20)
    amount              = models.DecimalField(max_digits=10, decimal_places=2)
    account_ref         = models.CharField(max_length=50)   # e.g. "B1-MODULE"
    status              = models.CharField(max_length=20, choices=STATUS, default="pending")
    mpesa_receipt       = models.CharField(max_length=50, blank=True)  # e.g. "QKB7T...RY0"
    result_desc         = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.phone} | {self.amount} KES | {self.status}"