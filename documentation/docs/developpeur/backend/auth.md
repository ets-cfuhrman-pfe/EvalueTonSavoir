# Authentification

Le but du module d'authentification est de pouvoir facilement faire des blocks de code permettant une authentification personalisée. Il est possible de le faire grâce a cette architecture.

```plantuml
@startuml

package Backend {
class AuthManager{
    +IAuthModule[] auths
    #userInfos
    
    -load()
    -registerAuths()
    +showAuths()

    +authStatus()
    +logIn(UserInfos)
    +register(UserInfos)
    +logOut()
}

interface IAuthModule{
    +registerAuth()
    +authenticate()
    +register()
    +showAuth()
}

class SimpleFormAuthModule{

}

class PassportAuthModule{
    IPassportProviderDefinition[] providers
}

Interface IPassportProviderDefinition{
    +name
    +type
}

class OAuthPassportProvider{
    +clientId
    +clientSecret
    +configUrl
    +authorizeUrl
    +tokenUrl
    +userinfoUrl
    +logoutUrl
    +JWKSUrl
}

IAuthModule <|-- SimpleFormAuthModule
IAuthModule <|-- PassportAuthModule
IPassportProviderDefinition <|-- OAuthPassportProvider

AuthManager -> IAuthModule
PassportAuthModule -> IPassportProviderDefinition
}

package Frontend{ 
    class AuthDrawer{
        +IAuthVisual[] getAuthsVisual()
        +drawAuths()
    }

    Interface IAuthVisual{
        +draw()
    }

    class FormVisual{
        +FormInput[] formInputs
    }

    interface FormInput{
        +name
        +label
        +type
        +value
    }

    AuthDrawer -> IAuthVisual
    IAuthVisual <|-- FormVisual
    FormVisual -> FormInput
}

@enduml
```


Le fonctionnement peut être expliqué avec les diagrammes suivants : 


## Module : Passport Js
```plantuml
@startuml

box "Frontend"
participant User
Participant App
end box

box "Backend"
participant PassportAuthModule
participant Db
participant AuthManager
end box

box "Auth Server"
participant AuthServer
end box

User -> App : Get auth page
App -> User : auth page

User -> App : click OAuth button
App -> User : redirect to OAuth

User -> AuthServer: Login
AuthServer -> User: Redirect to Auth endpoint with token

User -> PassportAuthModule: Authenticate with token

PassportAuthModule -> AuthServer: get user info
AuthServer -> PassportAuthModule: userInfo

alt login
    PassportAuthModule -> Db : fetch local userInfo
    Db->PassportAuthModule: userInfo
    PassportAuthModule -> PassportAuthModule: Merge userInfo definition
    PassportAuthModule -> Db : update user profile
    Db->PassportAuthModule: userInfo
end 

alt register
    PassportAuthModule -> Db : fetch local userInfo
    Db->PassportAuthModule: null
    PassportAuthModule -> Db : create user profile
    Db->PassportAuthModule: userInfo
end 

PassportAuthModule -> AuthManager : login(userInfos)

AuthManager -> User: Give refresh token + Redirect to page
User -> App: get /
App -> User: Show Authenticated /
@enduml
```

## Module : SimpleAuth
```plantuml
@startuml

box "Frontend"
participant User
Participant App
end box

box "Backend"
participant SimpleAuthModule
participant Db
participant AuthManager
end box

User -> App : Get auth page
App -> User : auth page


alt Login
    User -> App : Send Login/Pass

    App -> SimpleAuthModule: Send login/pass

    SimpleAuthModule -> Db: get user info
    Db->SimpleAuthModule: user info
    SimpleAuthModule -> SimpleAuthModule: Validate Hash
end

alt register
    User -> App : Send Username + Password + Email

    App -> SimpleAuthModule: Send Username + Password + Email

    SimpleAuthModule -> Db: get user info
    Db -> SimpleAuthModule : null

    SimpleAuthModule -> Db: put user info
end 

SimpleAuthModule -> AuthManager: userInfo
AuthManager -> User: Give refresh token + Redirect to page
User -> App: get /
App -> User: Show Authenticated /
@enduml
```

## Comment les boutons sont affichés
```plantuml
@startuml

box "FrontEnd"
participant User
Participant FrontEnd
Participant AuthDrawer
end box

box "BackEnd"
participant API
participant AuthManager
participant Db
participant IAuthModule
end box

API -> API : load global configurations

create AuthManager
API -> AuthManager : instanciate with auth configurations


create IAuthModule
AuthManager -> IAuthModule : instanciate array

loop For each auth in auths
    AuthManager -> IAuthModule : register
    IAuthModule -> API : register routes
    API -> IAuthModule : route registration confirmation
    IAuthModule -> AuthManager : module registration confirmation
end

User -> FrontEnd : get login page

alt already logged in
    FrontEnd -> User: redirected to authenticated page
end

FrontEnd -> AuthDrawer : get auth visual
AuthDrawer -> API : get auth form data

API -> AuthManager : get auth form data


loop For each auth in auths
    AuthManager -> IAuthModule : get form data
    IAuthModule -> AuthManager : form data
end

AuthManager -> API : auth fom data
API -> AuthDrawer : auth form data

AuthDrawer -> AuthDrawer : make auth html
AuthDrawer -> FrontEnd : auth HTML
FrontEnd -> User : show auth page


@enduml
```

## Comment les sessions sont conservées
```plantuml
@startuml
    box "Frontend"
    participant User
    Participant App
    end box

    box "Backend"
    participant AuthManager
    participant IAuthModules
    end box

    App -> AuthManager : send refresh token

    AuthManager -> IAuthModules: ForEach check if logged
    IAuthModules -> AuthManager: is authenticated ?
    
    alt one logged in
        AuthManager -> App : send new token
    end

    alt all logged out
        AuthManager -> App : send error
        App -> App : destroy token
        App -> User : redirect to login page
    end

@enduml
```