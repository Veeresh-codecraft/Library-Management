import date from "date-and-time";
const today =date.format(new Date, "YYYY MM DD"); 
console.log(today);
console.log(typeof date.format(date.addDays(new Date, 45), "YYYY MMM DD"));
console.log( date.parse(date.format(date.addDays(new Date(), 45), "YYYY MM DD"),"YYYY MM DD"));