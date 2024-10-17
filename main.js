const apiParalelo = "https://pydolarve.org/api/v1/dollar?page=enparalelovzla";
        const apiBcv = "https://pydolarve.org/api/v1/dollar?page=bcv";

        let Paralelo;
        let bcv;

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

            } catch (error) {
                console.error('Error:', error);
            }
        }

        // Llamar a la función cuando se carga la página
        window.onload = fetchUsdValues;

        const handleSubmit = (e) => {
            e.preventDefault(); // Prevenir el envío del formulario por defecto
            let product = document.querySelector('#mi-input').value;

            // Realizar cálculos con los valores ya obtenidos
            let valorBs = Paralelo * product;
            let valorBcv = valorBs / bcv;

            // Mostrar resultados en la UI
            document.getElementById('bs-result').textContent = `Costo en Bolívares (Paralelo): ${valorBs.toFixed(2)} Bs`;
            document.getElementById('bcv-result').textContent = `Costo en Dólares (BCV): ${valorBcv.toFixed(2)} USD`;
        };