# Importa las funciones de la libreria de pygame
import math
import pygame
import random
from settings import heightOfScreen, widthOfScreen, black, red, FPS
from player import Player
#from obstacle import Obstacle

def main():

    # Inizializar pygame
    pygame.init()

    # Crear la screen del juego
    screen = pygame.display.set_mode((widthOfScreen, heightOfScreen))

    # Nombrar la screen del juego
    pygame.display.set_caption("Infinite Runner")

    # Clock para controlar los FPS
    clock = pygame.time.Clock()

    # Font para el score
    font = pygame.font.Font(None,36)

    # Inizializar objetos de juego
    player = Player()
    obstacles = []
    score = 0

    # Fondo de carretera dinamico
    background_image = pygame.image.load("images\plainBackground.jpg").convert()
    background_image = pygame.image.load("images\plainBackground.jpg").convert()
    background_y = 0 #Position initial

    difficulty = 0
    difficulty = 0

    # ciclo principal del juego
    gameOver = False

    sound_gameOver = False
    while True:
        # Manipulador de events
        for event in pygame.event.get():
            #Salir del juego si la screen es cerrada
            if event.type == pygame.QUIT:
                pygame.quit()
                return

            # Reinicia el juego si una tecla es precionada en caso de que estar en fin del juego
            if gameOver and (event.type == pygame.KEYDOWN or event.type == pygame.MOUSEBUTTONDOWN):
                return main() #Reinicia el juego al llamar la funcion main() de nuevo

        if not gameOver:

            # if random.randint(1,20 - difficulty) == 1:
            #     obstacles.append(Obstacle())
            
            # # Actualiza la position de cada obstaculo
            # for obstacle in obstacles:
            #     obstacle.refresh(difficulty)
            
            # # Remover los obstaculos que quedan fuera de la screen
            # obstacles = [obs for obs in obstacles if obs.rect.y < heightOfScreen]

            # # Colisiones
            # for obstacle in obstacles:
            #     if player.rect.colliderect(obstacle.rect):
            #         gameOver = True
            
            # # Contador de puntaje
            score += 1

            difficulty = math.ceil(score // 500)
            difficulty = math.ceil(score // 500)

            # Dibujar screen
            screen.blit(background_image, (0, background_y))
            screen.blit(background_image, (0, background_y - heightOfScreen))

        # # Dibujar jugador
            player.draw(screen)
            
            # # Dibujar cada obstaculo
            # for obstacle in obstacles:
            #     obstacle.draw(screen)

            # Mostrar el puntaje
            score_text = font.render(f"Score: {score}", True, black)
            screen.blit(score_text, (10, 10))

            # Setear la velocidad de movimiento del fondo
            background_y += 2 + difficulty
            background_y += 2 + difficulty

            # #Refresca la posicion del fondo
            if background_y >= heightOfScreen:
                background_y = 0

            # Refresca la posicion del jugador
            player.refresh()
        
        # Logica para final del juego para mostrat un texto
        if gameOver:
            # puntajeFinal = score
            # if puntajeFinal > mejorPuntaje:
            #     mejorPuntaje = puntajeFinal                
            messageOfGameOver = font.render("GAME OVER", True, red)
            messageOfRestart = font.render("Press a new key to restart", True, black)
            #puntajeRecord = font.render("BEST: " + str(mejorPuntaje) , True, black)
            screen.blit(messageOfGameOver, (widthOfScreen // 2 -messageOfGameOver.get_width() // 2, heightOfScreen // 2 - 50))
            screen.blit(messageOfRestart, (widthOfScreen // 2 - messageOfRestart.get_width() // 2, heightOfScreen // 2 + 50 ))
        # Actualiza la screen
        pygame.display.flip()

        # Velocidad del juego
        clock.tick(FPS)

    # Quit pygame
    pygame.quit()

if __name__ == "__main__":
    main()

