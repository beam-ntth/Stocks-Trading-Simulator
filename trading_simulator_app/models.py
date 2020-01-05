from django.db import models

# Create your models here.

# Stock symbol and name table
class Stock (models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=256)

    def __str__(self):
        return self.symbol

# Buy transaction table
class Buy (models.Model):
    symbol = models.ForeignKey(Stock, on_delete=models.CASCADE)
    number_bought = models.IntegerField()
    price_bought = models.FloatField()
    date_bought = models.DateField()

    def __str__(self):
        return self.symbol.symbol

# Sell transaction table
class Sell (models.Model):
    symbol = models.ForeignKey(Stock, on_delete=models.CASCADE)
    number_sold = models.IntegerField()
    price_sold = models.FloatField()
    date_sold = models.DateField()

    def __str__(self):
        return self.symbol.symbol