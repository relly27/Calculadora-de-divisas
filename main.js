const apiParalelo = "https://pydolarve.org/api/v1/dollar?page=enparalelovzla";
const apiBcv = "https://pydolarve.org/api/v1/dollar?page=bcv";

let Paralelo;
let bcv;
let promedio;

// Función para obtener los valores del USD cuando se carga la página
async function fetchUsdValues() {
    try {
        // Fetch para el dólar paralelo
        let responseParalelo = await fetch(apiParalelo);
        let dataParalelo = await responseParalelo.json();
        Paralelo = dataParalelo.monitors.enparalelovzla.price;
        document.getElementById('paralelo-valor').textContent = `Dólar Paralelo: ${Paralelo.toFixed(2)} Bs`;

        // Fetch para el dólar BCV
        let responseBcv = await fetch(apiBcv);
        let dataBcv = await responseBcv.json();
        bcv = dataBcv.monitors.usd.price;
        document.getElementById('bcv-valor').textContent = `Dólar BCV: ${bcv.toFixed(2)} Bs`;

        // Calcular el promedio de los valores
        promedio = (Paralelo + bcv) / 2;
        document.getElementById('promedio-valor').textContent = `Promedio: ${promedio.toFixed(2)} Bs`;

    } catch (error) {
        console.error('Error:', error);
    }
}

// Llamar a la función cuando se carga la página
window.onload = fetchUsdValues;

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

        document.getElementById('paralelo-result').textContent = `Costo en Bolívares (Paralelo): ${valorParaleloBs.toFixed(2)} Bs`;
        document.getElementById('promedio-result').textContent = `Costo en Bolívares (Promedio): ${valorPromedio.toFixed(2)} Bs`;
        document.getElementById('bcv-result').textContent = `Costo en Dólares (BCV): ${valorBcv.toFixed(2)} USD`;
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

        document.getElementById('paralelo-result').textContent = `Costo en Dólares (Paralelo): ${valorParaleloBs.toFixed(2)} USD`;
        document.getElementById('promedio-result').textContent = `Costo en Dólares (Promedio): ${valorPromedio.toFixed(2)} USD`;
        document.getElementById('bcv-result').textContent = `Costo en Dólares (BCV): ${valorBcv.toFixed(2)} USD`;
    } else {
        clearResults();
    }
}

// Función para limpiar los resultados
function clearResults() {
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
        inputUsd.style.display = 'none'; // Ocultar el otro input
        calculateBs(); // Calcular y mostrar resultados
    }
});

// Mostrar ambos inputs al hacer clic en el formulario (opcional)
// document.getElementById('form').addEventListener('click', () => {
//     inputUsd.style.display = 'block';
//     inputBs.style.display = 'block';
// });