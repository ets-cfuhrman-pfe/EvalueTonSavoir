# Salles de Quiz

## Introduction

Les salles de quiz ont été extraites dans leur propre conteneur afin de limiter les dégâts liés soit à une 
surutilisation d'une salle soit à une attaque sur le logiciel.

En effet, le découplement permet a un quiz de: 

 - Survivre même si le backend est non-fonctionnel
 - Mourir sans entrainer toute l'application avec elle
 - Créer/Supprimer des salles automatiquement dépendant de la demande

Pour effectuer ceci, il faut faire une petite gymnastique. Il y a une route dans l'api servant à gérer les salles.
Lorsqu'un utilisateur demande le socket d'une salle : "/api/rooms/{id}/socket", la requête rebondit sur le proxy Nginx. 
Celui-ci contacte le backend afin d'obtenir l'adresse de l'ordinateur auquel envoyer la requête et redirige le socket 
vers cette adresse.

## Déconstruction simple de la structure

Un module supplémentaire a été ajouté à la structure : Rooms.

L'objet `room` est la définition d'une salle de façon minimaliste. Cette définition est aggrandie avec l'information 
récoltée du "provider".
Le `provider` est le système gérant les différentes salles. Dans l'implémentation effectuée, il s'agit de docker.

Lorsque l'api des salles est instantié, celui-ci est lié avec un "provider", définissant comment les salles seront créées.
L'api des salles permet de les ajouter, les supprimer, et les consulter.

L'api lance deux "jobs":

- Une vérification de l'état de santé des salles. Celle-ci roule tous les 10 secondes et met a jour les salles.
- Une suppression des salles. Celle-ci roule tous les 30 secondes et supprimme automatiquement les salles ayant la 
mention de suppression.

## Besoins exprimés

Fiabilite : 

- Nous voulons s'assurer qu'il soit possible d'avoir un grand nombre d'élèves présent sans qu'il y ait des problèmes de 
déconnexions
- Nous voulons que le temps de réponse soit faible 
- Nous voulons que le système soit capable de fonctionner de facon indépendante

## Recis utilisateurs pris en comptes

- En tant qu'enseignant, je veux que tout mes élèves soient capable de se connecter à la salle de classe rapidement
- En tant qu'enseignant, je veux que la salle de quiz puisse survivre des pannes liées aux autres modules de l'aplication
- En tant qu'administrateur, je veux que les salles soient indépendantes et n'impactent pas les performances des autres salles
- En tant qu'administrateur, je veux que les salles puissent être hébergées séparément du projet

## Diagrammes

### Structure
```plantuml
@startuml
class Room{
    +id
    +name
    +host
    +nbStudents
    +mustBeCleaned
}

class RoomRepository {
    +get(id)
    +create(room)
    +delete(id)
    +update(room,id)
    +getAll()
}

class RoomController {
    +setupRoom(options)
    +deleteRoom(roomId)
    +listRooms()
    +getRoomStatus(roomId)
    +updateRoom(room,roomId)
}

class RoomRouter{
    + / : GET
    + /:id : GET
    + / : POST
    + /:id : PUT
    + /:id : DELETE
}

class BaseRoomProvider {
    +createRoom(roomid,options)
    +deleteRoom(roomId)
    +getRoomInfo(roomId)
    +getRoomStatus(roomId)
    +listRooms()
    -cleanup()
    -syncInstantiatedRooms()
    #updateRoomInfos()
}

class DockerRoomProvider
circle Dockerode


Room - RoomRepository
BaseRoomProvider o-- RoomRepository
DockerRoomProvider --|> BaseRoomProvider
DockerRoomProvider -left- Dockerode
Dockerode o-- QuizRoom
RoomController o-- BaseRoomProvider
RoomRouter o-- RoomController

class QuizRoom{
    +/health: GET
    +create-room()
    +join-room()
    +next-question()
    +launch-student-mode()
    +end-quiz()
    +submit-answers()
    -disconnect()
}
@enduml
```
Remarque:  Les signatures de fonctions semblent un peu partout car il y a des fonctions de classes standard, des appels 
HTTPS et des appels de sockets dans le même diagramme.

### Diagramme de séquence démontrant les communications
```plantuml
@startuml
    actor Teacher
    actor Student
    entity Nginx
    entity Frontend
    entity Api
    entity Docker
    entity Database

group Quiz Creation
    Teacher -> Frontend : Create a quizroom
    Frontend -> Api : Create a quizroom
    Api -> Docker : Create a quizroom
    Docker -> QuizRoom ** 
    QuizRoom -> Docker : creation successful
    Docker -> Api : Creation Successful

    loop every seconds until healthy or 30s:
        Api -> QuizRoom : Checking Health via /health
        QuizRoom -> Api : Doesn't answer, answer healthy or unhealthy
    end

    Api -> Database : Create Room
    Database -> Api : Room created
    Api -> Teacher : Route to room socket
end

group Quiz Joining:
    Teacher -> Nginx : Join Room
    Nginx -> Api : Get room infos from id
    Api -> Nginx : Ip:port of room 
    Nginx -> QuizRoom: Give teacher's connexion

    Student -> Frontend: Join Room X
    Frontend -> Nginx : Join Room X
    Nginx -> Api : Get room infos from id
    Api -> Nginx : Ip:port of room 
    Nginx -> QuizRoom: Give student's connexion

    QuizRoom -> QuizRoom : Give Quiz ... (Multiple actions)

    Student -> QuizRoom: Disconnect
    Teacher -> QuizRoom: Disconect 
end

group QuizManagement (Every 10 seconds)
    Api -> QuizRoom : Checking number of people in the room
    QuizRoom -> Api : Number of people (0) or Unhealthy
    Api -> Database : Mark room to deletion
end

group Quiz Deletion (Every 30 seconds)
    Api -> Database : Give all rooms marked for deletion
    Database -> Api : rooms
    Api -> Docker : delete rooms
    Docker -> QuizRoom : delete
    Docker -> Api : Deleted
end

@enduml
```

## API

<swagger-ui src="salle-de-quiz-swagger.json"/>
