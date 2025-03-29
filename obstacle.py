import pygame # Importar pygame para desarrollo de juego
import random # Importar para resultados aleatorios
from settings import blanco, anchoDePantalla, verde

class Obstacle:
    def __init__(self):
        self.ancho = random.randint(30, 70)
        self.alto = random.randint(30, 70)
        self.color = verde
        self.x = random.randint(0, anchoDePantalla - self.ancho)
        self.y = -self.alto
        self.rect = pygame.Rect(self.x, self.y, self.ancho, self.alto)
        self.speed = 2
    
    def refrescar(self, dificultad):
        self.rect.y += self.speed + dificultad
    
    def draw(self, pantalla):
        pygame.draw.rect(pantalla, self.color, self.rect)
