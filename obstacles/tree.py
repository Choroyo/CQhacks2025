import pygame  # Import pygame for game development
import random  # Import for random results
from settings import widthOfScreen  # Import screen width setting

class Tree:
    def __init__(self):
        self.original_image = pygame.image.load("images/tree.png")  
        self.image = pygame.transform.scale(self.original_image, (150, 150))  
        
        # Use a smaller hitbox
        self.rect = pygame.Rect(0, 0, 80, 120)  # Adjust the width and height for better accuracy
        self.rect.x = random.randint(0, widthOfScreen - self.rect.width)
        self.rect.y = -self.rect.height  

        self.speed = 2  

    def refrescar(self, difficulty):
        self.rect.y += self.speed + difficulty  

    def draw(self, screen):
        screen.blit(self.image, (self.rect.x - 35, self.rect.y - 15))  # Offset to match the visual tree
