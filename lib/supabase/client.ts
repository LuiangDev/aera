import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 * Solo se usa con la clave publishable/anon: cualquier llamada a proveedores de OCR/IA
 * va del lado del servidor (§27), nunca desde aquí.
 *
 * Todavía no hay proyecto creado: estas funciones quedan listas y la app sigue leyendo
 * de la capa mock hasta que se definan las variables de entorno.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copia .env.local.example a .env.local con los datos del proyecto.",
    );
  }

  return createBrowserClient(url, key);
}

/** true cuando el backend ya está configurado; permite conectar pantalla por pantalla. */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
