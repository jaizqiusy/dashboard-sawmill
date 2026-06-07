import https from 'https';

const url = 'https://drive.google.com/uc?export=view&id=1WnWk5nAfy21nGhcSXoSGnUapvOGQDWWQ';

https.get(url, (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
});
