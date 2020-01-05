from django.contrib import admin
from .models import Stock, Buy, Sell

# Register your models here.
admin.site.register(Stock)
admin.site.register(Buy)
admin.site.register(Sell)