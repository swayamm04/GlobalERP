const axios = require('axios');

async function testReports() {
    try {
        console.log('Testing Sales Summary...');
        const sales = await axios.get('http://localhost:5000/api/reports/sales/summary');
        console.log('Sales Data:', sales.data.length, 'records');
        if (sales.data.length > 0) console.log('Sample:', sales.data[0]);

        console.log('\nTesting Product Stock...');
        const stock = await axios.get('http://localhost:5000/api/reports/inventory/products');
        console.log('Stock Data:', stock.data.length, 'records');
        if (stock.data.length > 0) console.log('Sample:', stock.data[0]);

    } catch (error) {
        console.error('Error fetching reports:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testReports();
