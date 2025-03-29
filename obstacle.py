import pygame # Importar pygame para desarrollo de juego
import random # Importar para resultados aleatorios
from settings import blanco, widthOfScreen, verde

class Obstacle:
    def __init__(self):
        self.ancho = random.randint(30, 70)
        self.alto = random.randint(30, 70)
        self.color = verde
        self.x = random.randint(0, widthOfScreen - self.ancho)
        self.y = -self.alto
        self.rect = pygame.Rect(self.x, self.y, self.ancho, self.alto)
        self.speed = 2
    
    def refrescar(self, difficulty):
        self.rect.y += self.speed + difficulty
    
    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect)
