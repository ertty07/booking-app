export function generateSlots(date, durationMinutes, bookings) {
    const slots = []
    const startHour = 9   // opens at 9:00
    const endHour = 17    // closes at 17:00

    let current = new Date(`${date}T0${startHour}:00:00`)
    const close = new Date(`${date}T${endHour}:00:00`)

    while (current.getTime() + durationMinutes * 60000 <= close.getTime()) {
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000)

        const taken = bookings.some(b =>
            current < new Date(b.end_time) && slotEnd > new Date(b.start_time)
        )

        if (!taken) slots.push({ start: current, end: slotEnd })
        current = slotEnd
    }
    return slots
}