const moment = require("moment-timezone");

/**
 * Formats a date string into a JavaScript Date object in the Asia/Dhaka timezone.
 * @param {string} dateString - The date string (ISO format, e.g., '2024-06-30' or '2024-06-30T14:30')
 * @param {string} position - 'start' or 'end' for date-only (not used when isDateTime is true)
 * @param {boolean} isDateTime - If true, treat as full datetime; if false, apply start/end of day
 * @returns {Date} - JavaScript Date object in UTC time but shifted from Asia/Dhaka
 */
function formatDate(dateString, position, isDateTime = false) {
  const zone = "Asia/Dhaka";

  if (isDateTime) {
    return moment.tz(dateString, zone).toDate();
  }

  const momentObj = moment.tz(dateString, zone);
  return position === "start"
    ? momentObj.startOf("day").toDate()
    : momentObj.endOf("day").toDate();
}

module.exports = formatDate;
