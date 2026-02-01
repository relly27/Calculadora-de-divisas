// API con proxy alternativo para móviles
const API_PROXY = "https://api.codetabs.com/v1/proxy/?quest=https://www.bancodevenezuela.com/files/tasas/tasas2.json";

let Paralelo;
let bcv;
let promedio;

// ===== CONFIGURACIÓN INICIAL =====

// Deshabilitar Service Worker en móviles si causa problemas
if ('serviceWorker' in navigator && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
            console.log('Service Worker deshabilitado para dispositivo móvil');
        }
    });
}

// ===== FUNCIONES DE UTILIDAD =====

// Función para formatear fecha y hora
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para crear elemento de porcentaje
function getPercentageElement(value) {
    const isPositive = value >= 0;
    const symbol = isPositive ? '+' : '';
    const colorClass = isPositive ? 'text-success' : 'text-danger';

    const small = document.createElement('small');
    small.className = colorClass;
    small.textContent = ` ${symbol}${value.toFixed(2)}%`;

    return small;
}

// ===== MANEJO DE DATOS =====

// Función para actualizar los valores en la interfaz
function updateValues(data) {
    if (!data || typeof data.Paralelo !== 'number' || typeof data.bcv !== 'number' || typeof data.promedio !== 'number') {
        console.error("Datos inválidos o incompletos:", data);
        
        // Usar valores por defecto
        data = {
            Paralelo: 50.00,
            bcv: 45.00,
            promedio: 47.50
        };
        
        document.getElementById('last-update').innerHTML = 
            '<span class="text-warning">⚠️ Usando valores por defecto</span>';
    }

    Paralelo = data.Paralelo;
    bcv = data.bcv;
    promedio = data.promedio;

    // Calcular porcentajes
    let porcentajes = {
        paralelo: ((Paralelo - bcv) / bcv) * 100,
        promedio: ((promedio - Paralelo) / Paralelo) * 100,
        bcv: ((bcv - Paralelo) / Paralelo) * 100,
    }

    // Actualizar elementos en la interfaz
    const paraleloElement = document.getElementById('paralelo-valor');
    paraleloElement.textContent = `Euro BCV: ${Paralelo.toFixed(2)} Bs`;
    paraleloElement.appendChild(getPercentageElement(porcentajes.paralelo));

    const bcvElement = document.getElementById('bcv-valor');
    bcvElement.textContent = `Dólar BCV: ${bcv.toFixed(2)} Bs`;
    bcvElement.appendChild(getPercentageElement(porcentajes.bcv));

    const promedioElement = document.getElementById('promedio-valor');
    promedioElement.textContent = `Dólar Promedio: ${promedio.toFixed(2)} Bs`;
    promedioElement.appendChild(getPercentageElement(porcentajes.promedio));
    
    // Actualizar calculadora si hay valores en los inputs
    const inputUsd = document.getElementById('mi-input');
    const inputBs = document.getElementById('mi-input2');
    
    if (inputUsd.value) calculateUsd();
    if (inputBs.value) calculateBs();
}

// Función para obtener valores con fallback a proxies alternativos
async function fetchWithRetry() {
    const proxies = [
        "https://api.codetabs.com/v1/proxy/?quest=https://www.bancodevenezuela.com/files/tasas/tasas2.json",
        "https://cors.eu.org/https://www.bancodevenezuela.com/files/tasas/tasas2.json",
        "https://thingproxy.freeboard.io/fetch/https://www.bancodevenezuela.com/files/tasas/tasas2.json"
    ];

    for (let i = 0; i < proxies.length; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(proxies[i], {
                signal: controller.signal,
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const text = await response.text();
                const cleanedText = text.replace(/^\uFEFF/, '').trim();
                return JSON.parse(cleanedText);
            }
        } catch (error) {
            console.log(`Proxy ${i + 1} falló, intentando siguiente...`);
            continue;
        }
    }
    
    throw new Error('Todos los proxies fallaron');
}

// Función principal para obtener valores
async function fetchUsdValues() {
    const storedData = localStorage.getItem('usdValues');
    const now = new Date().getTime();
    
    // Tiempo de caché más corto en móviles
    const cacheTime = /Mobi|Android|iPhone/i.test(navigator.userAgent) 
        ? 30 * 60 * 1000  // 30 minutos en móviles
        : 4 * 60 * 60 * 1000;  // 4 horas en desktop

    // Mostrar datos cacheados si son recientes
    if (storedData) {
        const { data, timestamp } = JSON.parse(storedData);
        document.getElementById('last-update').textContent = 
            `Última actualización: ${formatDateTime(timestamp)}`;
        
        if (now - timestamp < cacheTime) {
            updateValues(data);
            
            // Actualizar en segundo plano si tiene más de 15 minutos
            if (now - timestamp > 15 * 60 * 1000) {
                setTimeout(() => fetchUsdValues(true), 1000);
            }
            
            return;
        }
    }

    // Mostrar indicador de carga
    const originalButtonHTML = document.getElementById('update-button').innerHTML;
    document.getElementById('last-update').textContent = 'Actualizando...';
    document.getElementById('update-button').disabled = true;
    document.getElementById('update-button').innerHTML = '<i class="fa fa-spinner fa-spin"></i>';

    try {
        const dataParalelo = await fetchWithRetry();
        
        // Parsear valores de manera segura
        const euroStr = dataParalelo?.mesacambio?.bcv?.euros || '50,00';
        const usdStr = dataParalelo?.mesacambio?.bcv?.dolares || '45,00';
        
        const euroValue = parseFloat(euroStr.replace(',', '.'));
        const usdValue = parseFloat(usdStr.replace(',', '.'));
        
        const newData = {
            Paralelo: !isNaN(euroValue) ? euroValue : 50.00,
            bcv: !isNaN(usdValue) ? usdValue : 45.00,
            promedio: (!isNaN(euroValue) && !isNaN(usdValue)) ? (euroValue + usdValue) / 2 : 47.50
        };

        // Guardar en localStorage
        localStorage.setItem('usdValues', JSON.stringify({ 
            data: newData, 
            timestamp: now 
        }));

        // Actualizar interfaz
        document.getElementById('last-update').textContent = 
            `Actualizado: ${formatDateTime(now)}`;
        updateValues(newData);
        
        // Mostrar notificación de éxito en móviles
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            showMobileNotification('✓ Datos actualizados');
        }

    } catch (error) {
        console.error('Error obteniendo datos:', error);
        
        // Mostrar mensaje de error
        document.getElementById('last-update').innerHTML = 
            '<span class="text-danger">❌ Error de conexión</span>';
        
        // Usar datos almacenados si existen
        if (storedData) {
            const { data } = JSON.parse(storedData);
            document.getElementById('last-update').innerHTML = 
                `Última actualización: ${formatDateTime(JSON.parse(storedData).timestamp)} <span class="text-warning">(datos anteriores)</span>`;
            updateValues(data);
        } else {
            // Valores por defecto
            updateValues({
                Paralelo: 50.00,
                bcv: 45.00,
                promedio: 47.50
            });
        }
    } finally {
        // Restaurar botón a su estado original
        document.getElementById('update-button').disabled = false;
        document.getElementById('update-button').innerHTML = originalButtonHTML;
    }
}

// ===== FUNCIONALIDAD DE CALCULADORA =====

// Seleccionar inputs
const inputUsd = document.getElementById('mi-input');
const inputBs = document.getElementById('mi-input2');

// Función para calcular USD a Bs
function calculateUsd() {
    const product = parseFloat(inputUsd.value);
    
    if (!isNaN(product) && product > 0 && Paralelo && bcv && promedio) {
        const valorParaleloBs = Paralelo * product;
        const valorBcv = bcv * product;
        const valorPromedio = promedio * product;

        document.getElementById('paralelo-result').textContent = 
            `Costo en Bs (EUROS): ${valorParaleloBs.toFixed(2)} Bs`;
        document.getElementById('promedio-result').textContent = 
            `Costo en Bs (Promedio): ${valorPromedio.toFixed(2)} Bs`;
        document.getElementById('bcv-result').textContent = 
            `Costo en Bs (BCV): ${valorBcv.toFixed(2)} Bs`;
    } else {
        clearResults();
    }
}

// Función para calcular Bs a USD
function calculateBs() {
    const product = parseFloat(inputBs.value);
    
    if (!isNaN(product) && product > 0 && Paralelo && bcv && promedio) {
        const valorParaleloBs = product / Paralelo;
        const valorBcv = product / bcv;
        const valorPromedio = product / promedio;

        document.getElementById('paralelo-result').textContent = 
            `Costo en USD (EUROS): ${valorParaleloBs.toFixed(2)} USD`;
        document.getElementById('promedio-result').textContent = 
            `Costo en USD (Promedio): ${valorPromedio.toFixed(2)} USD`;
        document.getElementById('bcv-result').textContent = 
            `Costo en USD (BCV): ${valorBcv.toFixed(2)} USD`;
    } else {
        clearResults();
    }
}

// Función para limpiar resultados
function clearResults() {
    document.getElementById('labelMonto').textContent = "Ingresa el monto:";
    document.getElementById('paralelo-result').textContent = 'Costo en (EUROS): --';
    document.getElementById('promedio-result').textContent = 'Costo en (Promedio): --';
    document.getElementById('bcv-result').textContent = 'Costo en (BCV): --';
}

// Eventos para inputs
inputUsd.addEventListener('input', () => {
    if (inputUsd.value === "") {
        inputUsd.style.display = 'block';
        inputBs.style.display = 'block';
        clearResults();
    } else {
        document.getElementById("labelMonto").textContent = "Ingresa el monto en dólares:";
        inputBs.style.display = 'none';
        calculateUsd();
    }
});

inputBs.addEventListener('input', () => {
    if (inputBs.value === "") {
        inputUsd.style.display = 'block';
        inputBs.style.display = 'block';
        clearResults();
    } else {
        document.getElementById("labelMonto").textContent = "Ingresa el monto en Bs:";
        inputUsd.style.display = 'none';
        calculateBs();
    }
});

// ===== FUNCIONALIDAD ADICIONAL =====

// Función para copiar al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Mostrar feedback visual
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            showMobileNotification('✓ Copiado al portapapeles');
        }
    } catch (error) {
        console.error('Error al copiar:', error);
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Configurar botones de copiar
function setupCopyButtons() {
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const textToCopy = targetElement.textContent.split(': ')[1]?.split(' ')[0] || '';
                if (textToCopy) {
                    copyToClipboard(textToCopy);
                }
            }
        });
    });
}

// Función para mostrar notificaciones en móviles
function showMobileNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
        font-size: 14px;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; bottom: 0; }
            10% { opacity: 1; bottom: 20px; }
            90% { opacity: 1; bottom: 20px; }
            100% { opacity: 0; bottom: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Función para restablecer todo
function resetAll() {
    inputUsd.value = '';
    inputBs.value = '';
    inputUsd.style.display = 'block';
    inputBs.style.display = 'block';
    document.getElementById('labelMonto').textContent = "Ingresa el monto:";
    clearResults();
    inputUsd.focus();
}

// ===== INICIALIZACIÓN =====

// Al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    // Obtener datos iniciales
    fetchUsdValues();
    
    // Configurar botones de copiar
    setupCopyButtons();
    
    // Configurar botón de actualización
    document.getElementById('update-button').addEventListener('click', () => {
        localStorage.removeItem('usdValues');
        fetchUsdValues();
    });
    
    // Configurar botón de reset
    document.getElementById('reset-button').addEventListener('click', (event) => {
        event.preventDefault();
        resetAll();
    });
    
    // Detectar si es móvil y ajustar comportamiento
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        console.log('Dispositivo móvil detectado');
        
        // Ajustes específicos para móviles
        document.body.classList.add('mobile-device');
    }
});

// Manejar conexión/desconexión en móviles
window.addEventListener('online', () => {
    console.log('Conexión restablecida');
    const storedData = localStorage.getItem('usdValues');
    if (storedData) {
        const { timestamp } = JSON.parse(storedData);
        const now = new Date().getTime();
        if (now - timestamp > 30 * 60 * 1000) { // 30 minutos
            fetchUsdValues();
        }
    }
});

window.addEventListener('offline', () => {
    console.log('Sin conexión');
    const lastUpdateElement = document.getElementById('last-update');
    if (!lastUpdateElement.innerHTML.includes('(sin conexión)')) {
        lastUpdateElement.innerHTML += ' <span class="text-warning">(sin conexión)</span>';
    }
});