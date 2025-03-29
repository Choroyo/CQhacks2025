import pygame  # Import pygame for game development
import random  # Import for random results
from settings import widthOfScreen  # Import screen width setting

class Hole:
    def __init__(self):
        self.original_image = pygame.image.load("images/hole.png")  # Load original image
        
        # Generate a random size (e.g., between 30x30 and 80x80)
        random_size = random.randint(30, 80)  
        
        # Scale image to the random size
        self.image = pygame.transform.scale(self.original_image, (random_size, random_size))  
        
        # Get updated rect size
        self.rect = self.image.get_rect()  
        
        # Random X position based on new width
        self.rect.x = random.randint(0, widthOfScreen - self.rect.width)  
        self.rect.y = -self.rect.height  # Start above the screen
        self.speed = 2  # Default speed

    def refrescar(self, difficulty):
        # Move the hole downward (size stays the same)
        self.rect.y += self.speed + difficulty  

    def draw(self, screen):
        # Draw the hole on the screen
        screen.blit(self.image, self.rect)

