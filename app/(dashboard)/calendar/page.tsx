'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  appointment_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  status: string;
}

export default function CalendarPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    appointment_type: 'property_showing',
    date: '',
    start_time: '10:00',
    end_time: '11:00',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadAppointments();
  }, [currentDate]);

  async function loadAppointments() {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString())
      .order('start_time');

    if (!error && data) setAppointments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.end_time}:00`);

    const { error } = await supabase.from('appointments').insert([{
      title: formData.title,
      appointment_type: formData.appointment_type,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: formData.location,
      description: formData.description,
      status: 'scheduled'
    }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Appointment created!');
      setShowModal(false);
      loadAppointments();
      setFormData({ title: '', appointment_type: 'property_showing', date: '', start_time: '10:00', end_time: '11:00', location: '', description: '' });
    }
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  }

  function getAppointmentsForDay(date: Date) {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === date.toDateString();
    });
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getTypeColor(type: string) {
    const colors: any = { property_showing: 'bg-blue-500', seller_meeting: 'bg-green-500', investor_meeting: 'bg-purple-500', closing: 'bg-red-500', inspection: 'bg-yellow-500' };
    return colors[type] || 'bg-gray-500';
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">Schedule appointments and property showings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />New Appointment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Today</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-24 bg-gray-50 rounded-lg" />;
            const dayAppts = getAppointmentsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={date.toISOString()} className={`h-24 border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>{date.getDate()}</div>
                <div className="space-y-1 overflow-y-auto max-h-16">
                  {dayAppts.slice(0, 2).map(apt => (
                    <div key={apt.id} className={`text-xs px-2 py-1 rounded text-white ${getTypeColor(apt.appointment_type)}`} title={apt.title}>
                      {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} {apt.title.substring(0, 12)}...
                    </div>
                  ))}
                  {dayAppts.length > 2 && <div className="text-xs text-gray-500 px-2">+{dayAppts.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Appointment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Property Showing - 123 Main St" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select required value={formData.appointment_type} onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="property_showing">Property Showing</option>
                      <option value="seller_meeting">Seller Meeting</option>
                      <option value="investor_meeting">Investor Meeting</option>
                      <option value="closing">Closing</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <input type="time" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="123 Main St" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div className="flex gap-3 pt-6 border-t">
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
