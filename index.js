// index.js
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT = '2-193080671'; // your custom object type
const BASE_URL = 'https://api.hubapi.com';

if (!HUBSPOT_TOKEN) {
  console.warn('Warning: HUBSPOT_PRIVATE_APP_TOKEN is not set in .env');
}

// Create an axios instance with auth header
const hubspot = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Homepage: list custom object records
app.get('/', async (req, res) => {
  try {
    const properties = [
      'name',
      'company',
      'codename',
    ].join(',');

    const resp = await hubspot.get(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      params: { properties, limit: 100 },
    });

    const records = (resp.data.results || []).map((r) => ({
      id: r.id,
      properties: r.properties || {},
    }));

    res.render('homepage', { title: 'Custom Objects | IWH Practicum', data: records });
  } catch (err) {
    console.error('Error fetching custom objects:', err.response?.data || err.message);
    res.render('homepage', { title: 'Custom Objects | IWH Practicum', data: [], error: err.response?.data?.message || err.message });
  }
});

// Render form to create a new custom object record
app.get('/update-cobj', (req, res) => {
  res.render('updates', { title: 'Update Custom Object Form | Integrating With HubSpot I Practicum' });
});

// Receive form submission, create record in HubSpot, then redirect home
app.post('/update-cobj', async (req, res) => {
  try {
    const { name, company, codename } = req.body;

    // Build payload - use exactly the property API names
    const payload = {
      properties: {
        name: name || '',
        company: company || '',
        codename: codename || '',
      },
    };

    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, payload);

    // After creation, redirect back to homepage to show the new record
    res.redirect('/');
  } catch (err) {
    console.error('Error creating custom object:', err.response?.data || err.message);
    // For practicum it's acceptable to send an error page — keep simple:
    res.status(500).send('There was an error creating the record. Check server logs.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`));
