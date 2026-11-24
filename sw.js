/* ==========================================
   SALUD 360°
   SERVICE WORKER v9

   Estrategia:
   Network with Cache Fallback
========================================== */

/* 1. CONFIGURACIÓN */

const VERSION = "v9";

const PREFIJO = "salud360-demo-";

const CACHE_ESTATICO =
  `${PREFIJO}estatico-${VERSION}`;

const CACHE_DINAMICO =
  `${PREFIJO}dinamico-${VERSION}`;

const OFFLINE = "./offline.html";

/* 2. ARCHIVOS ESENCIALES */

const ARCHIVOS = [
  "./offline.html",
  "./index.html",
  "./login.html",
  "./registro.html",
  "./css/style.css",
  "./js/app.js",
  "./js/auth.js",
  "./js/firebase.js",
  "./manifest.json"
];

/* 3. ICONOS */

const ICONOS = [
  "./img/imagenes/icons/salud1.png",
  "./img/imagenes/icons/salud2.png",
  "./img/imagenes/icons/salud3.png",
  "./img/imagenes/icons/salud4.png",
  "./img/imagenes/icons/empresa1.png",
  "./img/imagenes/icons/empresa2.png",
  "./img/imagenes/icons/empresa3.png",
  "./img/imagenes/icons/empresa4.png"
];

/* 4. RECURSOS PÚBLICOS PERMITIDOS */

const RECURSOS_PUBLICOS = new Set(

  [...ARCHIVOS, ...ICONOS].map(ruta =>

    new URL(ruta, self.registration.scope).href

  )

);

/* 5. INSTALACIÓN */

self.addEventListener("install", event => {

  event.waitUntil(

    (async () => {

      const cache =
        await caches.open(CACHE_ESTATICO);

      // Los archivos esenciales deben existir.
      await cache.addAll(ARCHIVOS);

      // Los iconos son recursos opcionales.
      await Promise.all(

        ICONOS.map(async icono => {

          try {

            await cache.add(icono);

          } catch (error) {

            console.warn(
              "Icono no disponible:",
              icono
            );

          }

        })

      );

      console.log(
        "Salud 360°: caché estático creado"
      );

      await self.skipWaiting();

    })()

  );

});

/* 6. ACTIVACIÓN */

self.addEventListener("activate", event => {

  event.waitUntil(

    (async () => {

      const claves = await caches.keys();

      // Eliminar versiones anteriores del proyecto.
      await Promise.all(

        claves

          .filter(clave =>

            clave.startsWith(PREFIJO) &&

            clave !== CACHE_ESTATICO &&

            clave !== CACHE_DINAMICO

          )

          .map(clave => caches.delete(clave))

      );

      // Crear el espacio de caché dinámico.
      await caches.open(CACHE_DINAMICO);

      await self.clients.claim();

      console.log(
        "Salud 360°: Service Worker v9 activo"
      );

    })()

  );

});

/* 7. INTERCEPTAR SOLICITUDES */

self.addEventListener("fetch", event => {

  const request = event.request;

  const url = new URL(request.url);

  // Solo solicitudes GET.
  if (request.method !== "GET") return;

  // No interceptar servicios externos.
  if (url.origin !== self.location.origin) return;

  // Excluir rutas reservadas de Firebase.
  if (url.pathname.includes("/__/")) return;

  // Excluir la comprobación de conexión.
  if (url.searchParams.has("conexion")) return;

  /* 8. NAVEGACIÓN ENTRE PÁGINAS */

  if (request.mode === "navigate") {

    event.respondWith(

      (async () => {

        try {

          // Intentar cargar la página desde la red.
          return await fetch(request);

        } catch (error) {

          // Mostrar la página offline.
          const cache =
            await caches.open(CACHE_ESTATICO);

          const paginaOffline =
            await cache.match(OFFLINE);

          return paginaOffline || new Response(

            "Salud 360°: Sin conexión a internet.",

            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/plain; charset=UTF-8"
              }
            }

          );

        }

      })()

    );

    return;

  }

  /* 9. PROTEGER DATOS PRIVADOS */

  // Solo almacenar archivos públicos conocidos.
  if (!RECURSOS_PUBLICOS.has(url.href)) return;

  /* 10. NETWORK WITH CACHE FALLBACK */

  event.respondWith(

    (async () => {

      try {

        // Consultar primero la red.
        const respuesta = await fetch(request);

        if (respuesta.ok) {

          const cache =
            await caches.open(CACHE_DINAMICO);

          await cache.put(
            request,
            respuesta.clone()
          );

        }

        return respuesta;

      } catch (error) {

        // Buscar primero en el caché dinámico.
        const dinamico =
          await caches.open(CACHE_DINAMICO);

        const recursoDinamico =
          await dinamico.match(request);

        if (recursoDinamico) {

          return recursoDinamico;

        }

        // Buscar en el caché estático.
        const estatico =
          await caches.open(CACHE_ESTATICO);

        const recursoEstatico =
          await estatico.match(request);

        if (recursoEstatico) {

          return recursoEstatico;

        }

        return Response.error();

      }

    })()

  );

});