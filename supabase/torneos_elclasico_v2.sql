-- =====================================================================
-- Generador de Torneos · El Clásico — migración v2
-- · "categoria" se suma al nombre del torneo y se elimina la columna
-- · nueva columna "premio" (texto opcional)
-- Idempotente: se puede volver a correr.
-- =====================================================================
alter table public.torneos_elclasico_torneos add column if not exists premio text not null default '';

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'torneos_elclasico_torneos' and column_name = 'categoria') then
    update public.torneos_elclasico_torneos
       set nombre = concat_ws(' - ', nullif(trim(nombre), ''), nullif(trim(categoria), ''))
     where trim(categoria) <> '';
    alter table public.torneos_elclasico_torneos drop column categoria;
  end if;
end $$;
