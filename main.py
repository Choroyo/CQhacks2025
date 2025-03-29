# Importa las funciones de la libreria de pygame
import math
import pygame
import random
from settings import alturaDePantalla, anchoDePantalla, blanco, negro, rojo, FPS
from player import Player
from obstacle import Obstacle

def main():

    # Inizializar pygame
    pygame.init()

    # Crear la pantalla del juego
    pantalla = pygame.display.set_mode((anchoDePantalla, alturaDePantalla))

    # Nombrar la pantalla del juego
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
    background_image = pygame.image.load("D:\chori\Desktop\infiniteRunnerGame\infiniteRunnerGame\imagenes\plainBackground.jpg").convert()
    background_y = 0 #Position initial

    dificultad = 0

    # ciclo principal del juego
    finDelJuego = False

    while True:
        # Manipulador de eventos
        for evento in pygame.event.get():
            #Salir del juego si la pantalla es cerrada
            if evento.type == pygame.QUIT:
                pygame.quit()
                return

            # Reinicia el juego si una tecla es precionada en caso de que estar en fin del juego
            if finDelJuego and (evento.type == pygame.KEYDOWN or evento.type == pygame.MOUSEBUTTONDOWN):
                return main() #Reinicia el juego al llamar la funcion main() de nuevo

        if not finDelJuego:

            if random.randint(1,20 - dificultad) == 1:
                obstacles.append(Obstacle())
            
            # Actualiza la position de cada obstaculo
            for obstacle in obstacles:
                obstacle.refrescar(dificultad)
            
            # Remover los obstaculos que quedan fuera de la pantalla
            obstacles = [obs for obs in obstacles if obs.rect.y < alturaDePantalla]

            # Colisiones
            for obstacle in obstacles:
                if player.rect.colliderect(obstacle.rect):
                    finDelJuego = True
            
            # Contador de puntaje
            score += 1

            dificultad = math.ceil(score // 500)

            # Dibujar pantalla
            pantalla.blit(background_image, (0, background_y))
            pantalla.blit(background_image, (0, background_y - alturaDePantalla))

            # Dibujar jugador
            player.draw(pantalla)
            
            # Dibujar cada obstaculo
            for obstacle in obstacles:
                obstacle.draw(pantalla)

            # Mostrar el puntaje
            score_text = font.render(f"Score: {score}", True, negro)
            pantalla.blit(score_text, (10, 10))

            # Setear la velocidad de movimiento del fondo
            background_y += 2 + dificultad

            # #Refresca la posicion del fondo
            if background_y >= alturaDePantalla:
                background_y = 0

            # Refresca la posicion del jugador
            player.refrescar()
        
        # Logica para final del juego para mostrat un texto
        if finDelJuego:
            # puntajeFinal = score
            # if puntajeFinal > mejorPuntaje:
            #     mejorPuntaje = puntajeFinal                
            mensajeDeFinDelJuego = font.render("GAME OVER", True, rojo)
            mensajeDeReinicio = font.render("Preciona cualquier tecla para reiniciar", True, negro)
            #puntajeRecord = font.render("BEST: " + str(mejorPuntaje) , True, negro)
            pantalla.blit(mensajeDeFinDelJuego, (anchoDePantalla // 2 - mensajeDeFinDelJuego.get_width() // 2, alturaDePantalla // 2 - 50))
            pantalla.blit(mensajeDeReinicio, (anchoDePantalla // 2 - mensajeDeReinicio.get_width() // 2, alturaDePantalla // 2 + 50 ))
        # Actualiza la pantalla
        pygame.display.flip()

        # Velocidad del juego
        clock.tick(FPS)

    # Quit pygame
    pygame.quit()

if __name__ == "__main__":
    main()

