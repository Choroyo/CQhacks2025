import pygame  # Import pygame for game development
import random  # Import for random results
from settings import widthOfScreen  # Import screen width setting

class Rock:
    def __init__(self):
        self.original_image = pygame.image.load("images/rock.png")  # Load Hole image
        self.image = pygame.transform.scale(self.original_image, (50, 50))  # Resize to 50x50
        self.rect = self.image.get_rect()  # Get the new rect size
        self.rect.x = random.randint(0, widthOfScreen - self.rect.width)  # Random X position
        self.rect.y = -self.rect.height  # Start above the screen
        self.speed = 2  # Default speed

    def refrescar(self, difficulty):
        # Move the hole downward
        self.rect.y += self.speed + difficulty  

    def draw(self, screen):
        # Draw the hole on the screen
        screen.blit(self.image, self.rect)