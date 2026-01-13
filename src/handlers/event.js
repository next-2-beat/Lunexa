module.exports = async (client) => {
 
  client.on('ready', async () => {
   
     
          
    const loadcommand = dirs => {
        try {
            const events = readdirSync(`./src/events/${dirs}/`).filter(d => d.endsWith('.js'));
            for (let file of events) {
                const evt = require(`../events/${dirs}/${file}`);
                console.log(`> ${evt} Events Loaded !!`);

            }
          } catch (error) {
            console.log(error);
          }
    };})
};

function loadEvents(directory) {
  fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.lstatSync(filePath).isDirectory()) {
          loadEvents(filePath);
      } else {
          const eventName = file.split('.')[0];
          require(filePath)(client);
        console.log(`Updated Event ${eventName}`);
      }
  });
}