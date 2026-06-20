require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ==========================================
// 🔴 PARCHE PARA NODE 18: Soporte de WebSockets
// ==========================================
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGlobalEfimero() {
    console.log("🚀 Iniciando Test Global Efímero (Todas las tablas)...");

    try {
        // 1. Insertar Empresa (Con formato Markdown en datos_scraping)
        console.log("1️⃣ Insertando Empresa (inyectando Markdown)...");
        const markdownEjemplo = "## Perfil de la Empresa\n* Riesgo: **Alto**\n* Prioridad: Hackathon";
        
        const { data: empresa, error: errEmp } = await supabase.from('empresas')
            .insert([{ 
                nombre_empresa: 'Corporativo V-Shield', 
                sector: ['Ciberseguridad', 'Finanzas'],
                datos_scraping: markdownEjemplo
            }])
            .select().single();
        if (errEmp) throw errEmp;

        // 2. Insertar Empleado 1 (El "Dueño" de la voz)
        console.log("2️⃣ Insertando Empleado (Dueño de la voz clonada)...");
        const { data: empAtacante, error: errAtq } = await supabase.from('empleados')
            .insert([{
                empresa_id: empresa.id, nombre_completo: 'Jefe de Operaciones', telefono: '+525500000001',
                correo_electronico: 'jefe@vshield.com', departamento: 'Dirección', puesto: 'COO'
            }]).select().single();
        if (errAtq) throw errAtq;

        // 3. Insertar Empleado 2 (La Víctima)
        console.log("3️⃣ Insertando Empleado (Víctima)...");
        const { data: empVictima, error: errVic } = await supabase.from('empleados')
            .insert([{
                empresa_id: empresa.id, nombre_completo: 'Ingeniero Junior', telefono: '+525500000002',
                correo_electronico: 'junior@vshield.com', departamento: 'Desarrollo', puesto: 'Programador'
            }]).select().single();
        if (errVic) throw errVic;

        // 4. Insertar Voz Clonada (Vinculada al Jefe)
        console.log("4️⃣ Insertando Registro de Voz...");
        const { data: voz, error: errVoz } = await supabase.from('repertorio_voces')
            .insert([{
                empleado_id: empAtacante.id, elevenlabs_voice_id: 'modelo_xyz_789'
            }]).select().single();
        if (errVoz) throw errVoz;

        // 5. Insertar Simulación (Ataca al Junior usando la Voz del Jefe)
        console.log("5️⃣ Insertando Simulación (fecha_interaccion NULL)...");
        const { data: simulacion, error: errSim } = await supabase.from('simulaciones')
            .insert([{
                empleado_id: empVictima.id, voz_id: voz.id, guion_texto: 'Abre el puerto 8080 urgente.', estado: 'en_progreso'
            }]).select().single();
        if (errSim) throw errSim;

        // 6. Insertar Reporte Técnico
        console.log("6️⃣ Insertando Reporte en PDF...");
        const { data: reporte, error: errRep } = await supabase.from('reportes')
            .insert([{
                simulacion_id: simulacion.id, pdf_url: 'https://vshield.com/reporte-final.pdf'
            }]).select().single();
        if (errRep) throw errRep;

        console.log("\n✅ ¡ÉXITO! Todas las tablas se relacionaron perfectamente con las nuevas configuraciones.");

        // ==========================================
        // 🧹 FASE DE LIMPIEZA EN CASCADA
        // ==========================================
        console.log("\n🧹 Iniciando eliminación en cascada...");
        
        // Gracias al ON DELETE CASCADE del DDL, borrar a los empleados destruye automáticamente 
        // sus voces, simulaciones y reportes.
        await supabase.from('empleados').delete().in('id', [empAtacante.id, empVictima.id]);
        
        // Finalmente borramos la empresa
        await supabase.from('empresas').delete().eq('id', empresa.id);

        console.log("🎉 Entorno 100% limpio. No quedó rastro de la prueba.");

    } catch (error) {
        console.error("\n❌ ERROR DE BASE DE DATOS:", error.message || error);
    }
}

testGlobalEfimero();
