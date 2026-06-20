require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ==========================================
// 🔴 PARCHE PARA NODE 18: Soporte de WebSockets
// ==========================================
const WebSocket = require('ws');
global.WebSocket = WebSocket;
// ==========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function pruebaYLimpieza() {
    console.log("🧪 Iniciando prueba de inserción y almacenamiento...");

    // 1. Leer el archivo MP3 simulado
    const fileBuffer = fs.readFileSync('./audio_prueba.mp3');
    const fileName = `test_vishing_${Date.now()}.mp3`;

    // 2. Subir archivo a Supabase Storage (Bucket: vishing-audios)
    console.log("⏳ Subiendo MP3 al bucket...");
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('vishing-audios') 
        .upload(fileName, fileBuffer, { contentType: 'audio/mpeg' });

    if (uploadError) return console.error("❌ Error al subir audio:", uploadError.message);
    
    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from('vishing-audios').getPublicUrl(fileName);
    const audioUrl = publicUrlData.publicUrl;
    console.log(`✅ MP3 subido exitosamente. URL Temporal: ${audioUrl}`);

    // 3. Insertar Empresa de Prueba
    console.log("⏳ Insertando empresa...");
    const { data: empresa, error: empError } = await supabase
        .from('empresas')
        .insert([{ nombre_empresa: 'Empresa Fantasma', sector: ['Prueba'] }])
        .select().single();

    if (empError) return console.error("❌ Error BD:", empError.message);
    console.log(`✅ Empresa registrada temporalmente (ID: ${empresa.id})`);

    // ==========================================
    // 🧹 FASE DE LIMPIEZA (TEARDOWN)
    // ==========================================
    console.log("\n🧹 Iniciando protocolo de limpieza automática...");

    // Borrar de la base de datos
    await supabase.from('empresas').delete().eq('id', empresa.id);
    console.log("🗑️ Registro de base de datos eliminado.");

    // Borrar del Storage
    await supabase.storage.from('vishing-audios').remove([fileName]);
    console.log("🗑️ Archivo MP3 eliminado del bucket.");

    console.log("🎉 Prueba finalizada. Tu entorno está 100% limpio y funcional.");
}

pruebaYLimpieza();
