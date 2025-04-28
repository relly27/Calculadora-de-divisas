const apiParalelo = "https://pydolarve.org/api/v1/dollar?page=enparalelovzla";
const apiBcv = "https://pydolarve.org/api/v1/dollar?page=bcv";

let Paralelo;
let bcv;
let promedio;

// En tu main.js o similar
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        registration.update(); // Fuerza la actualización
      });
    });
  }

// Función para formatear la fecha y hora
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Formato local de fecha y hora
}

// Función para actualizar los valores en la interfaz
function updateValues(data) {
    Paralelo = data.Paralelo;
    bcv = data.bcv;
    promedio = data.promedio;
    
    let porcentajes = {
        paralelo: ((Paralelo - bcv) / bcv) * 100,
        promedio: ((promedio - Paralelo) / Paralelo) * 100,
        bcv: ((bcv - Paralelo) / Paralelo)* 100,
    }

    // Función auxiliar para determinar el color y el símbolo
    function getPercentageElement(value) {
        const isPositive = value >= 0;
        const symbol = isPositive ? '+' : '';
        const colorClass = isPositive ? 'text-success' : 'text-danger';
        
        const small = document.createElement('small');
        small.className = colorClass;
        small.textContent = ` ${symbol}${value.toFixed(2)}%`;
        
        return small;
    }

    // Actualizar los valores en la interfaz con los porcentajes
    const paraleloElement = document.getElementById('paralelo-valor');
    paraleloElement.textContent = `Dólar Paralelo: ${Paralelo.toFixed(2)} Bs`;
    paraleloElement.appendChild(getPercentageElement(porcentajes.paralelo));

    const bcvElement = document.getElementById('bcv-valor');
    bcvElement.textContent = `Dólar BCV: ${bcv.toFixed(2)} Bs`;
    bcvElement.appendChild(getPercentageElement(porcentajes.bcv));

    const promedioElement = document.getElementById('promedio-valor');
    promedioElement.textContent = `Promedio: ${promedio.toFixed(2)} Bs`;
    promedioElement.appendChild(getPercentageElement(porcentajes.promedio));
}

// Función para obtener los valores del USD desde la API o del localStorage
async function fetchUsdValues() {
    const storedData = localStorage.getItem('usdValues');
    const now = new Date().getTime();
    const fourHours = 4 * 60 * 60 * 1000; // 4 horas en milisegundos

    if (storedData) {
        const { data, timestamp } = JSON.parse(storedData);

        // Mostrar la última actualización
        document.getElementById('last-update').textContent = `Última actualización local: ${formatDateTime(timestamp)}`;

        // Verificar si han pasado menos de 4 horas
        if (now - timestamp < fourHours) {
            // Usar los datos almacenados si no han pasado 4 horas
            updateValues(data);
            return;
        }
    }

    // Si los datos son antiguos o no existen, hacer una nueva solicitud
    try {
        let responseParalelo = await fetch(apiParalelo);
        let dataParalelo = await responseParalelo.json();
        let responseBcv = await fetch(apiBcv);
        let dataBcv = await responseBcv.json();

        const newData = {
            Paralelo: dataParalelo.monitors.enparalelovzla.price,
            bcv: dataBcv.monitors.usd.price,
            promedio: (dataParalelo.monitors.enparalelovzla.price + dataBcv.monitors.usd.price) / 2
        };

        // Guardar los nuevos datos en el localStorage con la marca de tiempo actual
        localStorage.setItem('usdValues', JSON.stringify({ data: newData, timestamp: now }));

        // Mostrar la nueva fecha y hora de actualización
        document.getElementById('last-update').textContent = `Última actualización local: ${formatDateTime(now)}`;

        updateValues(newData);
    } catch (error) {
        console.error('Error:', error);
        // Si hay un error (por ejemplo, sin conexión), usar los datos almacenados
        if (storedData) {
            const { data } = JSON.parse(storedData);
            updateValues(data);
        } else {
            alert('No se pudieron cargar los datos. Verifica tu conexión a Internet.');
        }
    }
}

// Función para copiar el texto al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Texto copiado:', text); // Opcional: Mostrar un mensaje en la consola
    } catch (error) {
        console.error('Error al copiar:', error);
    }
}

// Función para agregar eventos a los botones de copiar
function setupCopyButtons() {
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent.split(': ')[1]; // Copiar solo el valor
            copyToClipboard(textToCopy);
        });
    });
}

// Llamar a la función cuando se carga la página
window.onload = () => {
    fetchUsdValues();
    setupCopyButtons(); // Configurar los botones de copiar al cargar la página
};

// Botón de actualización
document.getElementById('update-button').addEventListener('click', () => {
    localStorage.removeItem('usdValues'); // Eliminar los datos almacenados para forzar la actualización
    fetchUsdValues(); // Obtener nuevos datos
});

// Seleccionar los inputs
const inputUsd = document.querySelector('#mi-input');
const inputBs = document.querySelector('#mi-input2');

// Función para calcular USD a Bs
function calculateUsd() {
    let product = parseFloat(inputUsd.value);

    if (!isNaN(product)) {
        let valorParaleloBs = Paralelo * product;
        let valorBcv = bcv * product;
        let valorPromedio = promedio * product;

        // Actualizar solo el texto dentro del <span>
        document.getElementById('paralelo-result').textContent = `Costo en Bs (Paralelo): ${valorParaleloBs.toFixed(2)} Bs`;
        document.getElementById('promedio-result').textContent = `Costo en Bs (Promedio): ${valorPromedio.toFixed(2)} Bs`;
        document.getElementById('bcv-result').textContent = `Costo en Bs (BCV): ${valorBcv.toFixed(2)} Bs`;
    } else {
        clearResults();
    }
}

// Función para calcular Bs a USD
function calculateBs() {
    let product = parseFloat(inputBs.value);

    if (!isNaN(product)) {
        let valorParaleloBs = product / Paralelo;
        let valorBcv = product / bcv;
        let valorPromedio = product / promedio;

        // Actualizar solo el texto dentro del <span>
        document.getElementById('paralelo-result').textContent = `Costo en USD (Paralelo): ${valorParaleloBs.toFixed(2)} USD`;
        document.getElementById('promedio-result').textContent = `Costo en USD (Promedio): ${valorPromedio.toFixed(2)} USD`;
        document.getElementById('bcv-result').textContent = `Costo en USD (BCV): ${valorBcv.toFixed(2)} USD`;
    } else {
        clearResults();
    }
}

// Función para limpiar los resultados
function clearResults() {
    document.getElementById('labelMonto').textContent = "Ingresa el monto:";
    document.getElementById('paralelo-result').textContent = 'Costo en (Paralelo): --';
    document.getElementById('promedio-result').textContent = 'Costo en (Promedio): --';
    document.getElementById('bcv-result').textContent = 'Costo en (BCV): --';
}

// Evento input para el primer input (USD)
inputUsd.addEventListener('input', () => {
    if (inputUsd.value === "") {
        // Mostrar ambos inputs si este está vacío
        inputUsd.style.display = 'block';
        inputBs.style.display = 'block';
        clearResults(); // Limpiar resultados
    } else {
        document.getElementById("labelMonto").textContent = "Ingresa el monto en dólares:";
        inputBs.style.display = 'none'; // Ocultar el otro input
        calculateUsd(); // Calcular y mostrar resultados
    }
});

// Evento input para el segundo input (Bs)
inputBs.addEventListener('input', () => {
    if (inputBs.value === "") {
        // Mostrar ambos inputs si este está vacío
        inputUsd.style.display = 'block';
        inputBs.style.display = 'block';
        clearResults(); // Limpiar resultados
    } else {
        document.getElementById("labelMonto").textContent = "Ingresa el monto en Bs:";
        inputUsd.style.display = 'none'; // Ocultar el otro input
        calculateBs(); // Calcular y mostrar resultados
    }
});