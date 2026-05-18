const { fetchSupplierData } = require('./src/services/dataService');
fetchSupplierData().then(data => console.log('Parsed rows:', data.length, '\nSample:', data[0], '\nLast:', data[data.length-1]));
