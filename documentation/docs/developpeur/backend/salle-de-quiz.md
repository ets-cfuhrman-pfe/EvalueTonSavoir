# Salles de Quiz

Les salles de quiz ont été extraites dans leur propre container afin de limiter les dégats liés soit a une surutilisation d'une salle ou une attaque sur le logiciel.

En éffet, le découplement permet a un quiz de: 

 - Survivre même si le backend est non-fonctionnel
 - Mourir sans entrainer toute l'application avec elle
 - Créer/Supprimer des salles automatiquement dépendant de la demande

 Pour éffectuer ceci il faut éffectuer une petite gymnastique. Il y a une route dans l'api servant à gerer les salles. Lorsqu'un utilisateur demande le socket d'une salle : "/api/rooms/{id}/socket", la requette rebondit sur le proxy Nginx. Celui-ci contacte le backend afin d'obtenir l'addresse de l'ordinateur auquel envoyer la requette et redirige le socket vers ce pc.


## Diagramme de séquence
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

## Classes touchant cette fonctionalitée
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
DockerRoomProvider - Dockerode
Dockerode o-- QuizRoom
RoomController o-- BaseRoomProvider
RoomRouter o-- RoomController

class QuizRoom{
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