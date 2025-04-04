# Importa las funciones de la libreria de pygame
import math
import pygame
import random
from settings import heightOfScreen, widthOfScreen, white, black, red, FPS
from player import Player
from obstacles.hole import Hole
from obstacles.tree import Tree
from obstacles.queen import Queen
from obstacles.rock import Rock

def main():

    # Inizializar pygame
    pygame.init()

    # Crear la pantalla del juego
    screen = pygame.display.set_mode((widthOfScreen, heightOfScreen))

    # Nombrar la pantalla del juego
    pygame.display.set_caption("Mad Dash to Wonderland")

    # Clock para controlar los FPS
    clock = pygame.time.Clock()

    # Font para el score
    font = pygame.font.Font(None,36)

    # Inizializar objetos de juego
    player = Player()
    obstacles = []
    score = 0

    # Fondo de carretera dinamico
    background_image = pygame.image.load("images/forestb.png").convert()
    background_y = 0 #Position initial

    difficulty = 0

    # ciclo principal del juego
    gameOver = False

    soung_of_running = True
    sound_gameOver = False

     # Load start screen image
    start_screen_image = pygame.image.load("images\start_game_image.png").convert()

    # **SHOW START SCREEN**
    screen.blit(start_screen_image, (0, 0))
    pygame.display.flip()  # Refresh screen

    # **WAIT FOR USER INPUT TO START**
    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN or event.type == pygame.MOUSEBUTTONDOWN:
                waiting = False  # Exit start screen loop

    pygame.mixer.init()

    # Load MIDI file
    midi_path = "music\\albeniz\\alb_esp1.mid"  # Change to your MIDI file path
    pygame.mixer.music.load(midi_path)
    pygame.mixer.music.play(-1)  # Loop indefinitely

    while True:
        # Manipulador de eventos
        for evento in pygame.event.get():
            #Salir del juego si la pantalla es cerrada
            if evento.type == pygame.QUIT:
                pygame.quit()
                return

            # Reinicia el juego si una tecla es precionada en caso de que estar en fin del juego
            if gameOver and (evento.type == pygame.KEYDOWN or evento.type == pygame.MOUSEBUTTONDOWN):
                return main() #Reinicia el juego al llamar la funcion main() de nuevo

        if not gameOver:
            if not pygame.mixer.music.get_busy():  # Restart if it stops unexpectedly
                pygame.mixer.music.play(-1)

            if random.randint(1,150 - difficulty) == 1:
                obstacles.append(Hole()) # Agrega un nuevo obstaculo a la lista de obstaculos
            if random.randint(1,150 - difficulty) == 1:
                obstacles.append(Tree())
            if random.randint(1,250 - difficulty) == 1:
                obstacles.append(Queen())
            if random.randint(1,150 - difficulty) == 1:
                obstacles.append(Rock())
            
            # Actualiza la position de cada obstaculo
            for obstacle in obstacles:
                obstacle.refrescar(difficulty)
            
            # Remover los obstaculos que quedan fuera de la pantalla
            obstacles = [obs for obs in obstacles if obs.rect.y < heightOfScreen]

            # Colisiones
            for obstacle in obstacles:
                if player.rect.colliderect(obstacle.rect):
                   gameOver = True
            
            # Contador de puntaje
            score += 1

            difficulty = math.ceil(score // 500)

            # Dibujar pantalla
            screen.blit(background_image, (0, background_y))
            screen.blit(background_image, (0, background_y - heightOfScreen))

            # Dibujar jugador
            player.draw(screen)
            
            # Dibujar cada obstaculo
            for obstacle in obstacles:
                obstacle.draw(screen)

            # Mostrar el puntaje
            score_text = font.render(f"Score: {score}", True, black)
            screen.blit(score_text, (10, 10))

            # Setear la velocidad de movimiento del fondo
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
            pygame.mixer.music.stop()

            if not sound_gameOver:  # Check if sound has already been played
                game_over_sound = pygame.mixer.Sound("music\\game_over_sound.mp3")  # Load sound effect
                game_over_sound.play()  # Play the sound when the game ends
                sound_gameOver = True  # Set the flag to True so it doesn't play again


            mensajeDeFinDelJuego = font.render("GAME OVER", True, red)
            mensajeDeReinicio = font.render("You did not arrive Wonderland!", True, black)
            #puntajeRecord = font.render("BEST: " + str(mejorPuntaje) , True, black)
            screen.blit(mensajeDeFinDelJuego, (widthOfScreen // 2 - mensajeDeFinDelJuego.get_width() // 2, heightOfScreen // 2 - 50))
            screen.blit(mensajeDeReinicio, (widthOfScreen // 2 - mensajeDeReinicio.get_width() // 2, heightOfScreen // 2 + 50 ))
        # Actualiza la pantalla
        pygame.display.flip()

        # Velocidad del juego
        clock.tick(FPS)

    # Quit pygame
    pygame.quit()

if __name__ == "__main__":
    main()
