/*En todas las estrategias, el primer paso es subir a cache archivos
elegidos como necesarios, la elección depende del proyecto y sus necesidades
de carga sin conexión a interner*/ 
//CONSTANTES DE ALMACENAMIENTO CACHE
const CACHE ='salud360-cache-4';
const CACHE_DINAMICO ='salud360-dinamico-4';
const CACHE_ESTATICO ='salud360-estatico-4';
const CACHE_INMUTABLE ='salud360-inmutable-4';


/***********************INSTALACIÓN ************************
Indicamos que durante el proceso de instalación se registren 
los archivos base en cache acorde a su tipo
************************************************************/

self.addEventListener('install', evento=>{
    /*Promesa que crea el proceso de creación del espacio 
    en cache y agrega los archivos necesarios para cargar nuestra
    aplicación*/
    const cacheBase = caches.open(CACHE)
        .then(cache=>{
            return cache.addAll([
                './',
                './index.html',
                './login.html',
                './registro.html',
                './offline.html',
                './css/style.css',
                './js/app.js',
                './js/firebase.js',
                './js/auth.js',
                './manifest.json'
            ]);
        });

        //Separamos los archivos que no se modificarán en un espacio de cache inmutable
        const cacheInmutable = caches.open(CACHE_INMUTABLE)
            .then(cache=>{
                return cache.add(
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
                ).catch(()=>{});
            });

            //Indicamos que la instalación espere hasta que las promesas se cumplan
        evento.waitUntil(
            Promise.all([cacheBase, cacheInmutable])
                .then(()=>self.skipWaiting())
        );
});


/******************* FUNCIÓN DE LIMPIEZA DE CACHE ********************
/*Debemos mantener un número limitado e archivos para no sobrepasar el
espacio de almacenamiento cache, por ello se crea está función.
**********************************************************************/

//recibimos el nombre del espacio de cache a limpiar y el número de archivos permitido
function limpiarCache(nombreCache, numeroItems){
    //abrimos el cache
    return caches.open(nombreCache)
        .then(cache=>{
            //recuperamos el arreglo de archivos existentes en el espacio de cache
            return cache.keys()
                .then(keys=>{
                    //si el número de archivos supera el limite permitido
                    if (keys.length>numeroItems){
                        //eliminamos el más antiguo y repetimos el proceso
                        return cache.delete(keys[0])
                            .then(()=>limpiarCache(nombreCache, numeroItems));
                    }
                });
        });
}


/************************ ESTRATEGÍA 3  *****************************
                   NETWORK WITH CACHE FALLBACK 
Este modo de manejar el cache, implica que cuando se realiza una petición, 
primero se busque en la web y si no existe se dirija a buscar en cache.
***********************************************************************/

self.addEventListener('fetch', evento =>{

    if (evento.request.method !== 'GET') return;

    const url = new URL(evento.request.url);

    const archivosPublicos = [
        './',
        './index.html',
        './login.html',
        './registro.html',
        './offline.html',
        './css/style.css',
        './js/app.js',
        './js/firebase.js',
        './js/auth.js',
        './manifest.json'
    ].map(archivo => new URL(archivo, self.registration.scope).href);

    const esPublico = archivosPublicos.includes(url.href);

    const esInmutable = url.href ===
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';

    if (!esPublico && !esInmutable){

        if (evento.request.mode === 'navigate'){
            evento.respondWith(
                fetch(evento.request)
                    .catch(()=>caches.match('./offline.html'))
            );
        }

        return;
    }

   //Procesamos las peticiones del sitio a través del servidor (fetch)
    const respuesta = fetch(evento.request)
        .then(async resp=>{

            if (resp.ok && !resp.redirected){

                const copia = resp.clone();

                try {

                    //subimos el archivo recuperado a cache
                    const cache = await caches.open(CACHE_DINAMICO);

                    await cache.put(evento.request,copia);

                    //Limpiamos el cache dinámico
                    await limpiarCache(CACHE_DINAMICO,50);

                } catch(error){
                    console.error('Error al guardar en cache:',error);
                }
            }

            //retornamos la respuesta de la web
            return resp;   

        }).catch(async ()=>{
            //si no se puede recuperar de la web se busca en cache (match)
            const cache = await caches.open(CACHE_DINAMICO);

            const archivo = await cache.match(evento.request)
                || await caches.match(evento.request);

            if (archivo) return archivo;

            if (evento.request.mode === 'navigate'){
                const offline = await caches.match('./offline.html');

                if (offline) return offline;
            }

            return new Response('Sin conexión a internet',{
                status: 503,
                statusText: 'Service Unavailable'
            });
        });

        //retornamos la respuesta recuperada
        evento.respondWith(respuesta);

});


/*********************** ACTIVACIÓN ************************
Eliminamos las versiones anteriores de cache de la aplicación.
************************************************************/

self.addEventListener('activate', evento=>{

    const cachesPermitidos = [
        CACHE,
        CACHE_DINAMICO,
        CACHE_ESTATICO,
        CACHE_INMUTABLE
    ];

    evento.waitUntil(
        caches.keys()
            .then(keys=>{
                return Promise.all(
                    keys.filter(key=>
                        key.startsWith('salud360-') &&
                        !cachesPermitidos.includes(key)
                    ).map(key=>caches.delete(key))
                );
            })
            .then(()=>self.clients.claim())
    );
});