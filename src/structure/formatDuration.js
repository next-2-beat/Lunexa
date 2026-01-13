module.exports = (duration) => {
    if(isNaN(duration) || typeof duration === 'undefined') return '00:00';
    if(duration > 3600000000) return 'Live';
    return convertTime(duration, true);
};

function convertTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
    const hoursStr = hours < 10 ? `0${hours}` : hours;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
  
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }