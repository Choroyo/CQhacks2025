# Import the pygame library for game development 
import pygame
from settings import red, heightOfScreen, widthOfScreen

class Player:
    def __init__(self):
        self.size = 80
        self.image = pygame.image.load("images/whiter_rabbit.png")
        self.image = pygame.transform.scale(self.image, (self.size, self.size))

        self.x = widthOfScreen // 2
        self.y = heightOfScreen - 100  # Fixed this line
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
    
    def refresh(self):
        # Refresh the player's position to follow the cursor
        mouse_x, mouse_y = pygame.mouse.get_pos()
        self.rect.x = mouse_x - self.size // 2 
        self.rect.y = mouse_y - self.size // 2
    
    def draw(self, screen):
        screen.blit(self.image, self.rect)  # Fixed this line
