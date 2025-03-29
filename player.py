# Import the pygame library for game development
import pygame
from settings import rojo, alturaDePantalla, anchoDePantalla

class Player:
    def __init__(self):
        self.tamaño = 50
        self.color = rojo
        self.x = anchoDePantalla // 2
        self.y = anchoDePantalla - 100
        self.rect = pygame.Rect(self.x, self.y, self.tamaño, self.tamaño)
    
    def refrescar(self):
        # refresca la position del player siguiendo el cursor
        mouse_x, mouse_y = pygame.mouse.get_pos()
        self.rect.x = mouse_x - self.tamaño // 2 
        self.rect.y = mouse_y - self.tamaño // 2
    
    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect)
