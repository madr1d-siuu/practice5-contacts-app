import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from './contact';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:8080/api/contacts'
      : '/api/contacts';

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl);
  }

  addContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(
      this.apiUrl,
      contact
    );
  }

  updateContact(contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(
      `${this.apiUrl}/${contact._id}`,
      contact
    );
  }

  deleteContact(
    id: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`
    );
  }
}