import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact } from './contact';
import { ContactService } from './contact.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly contactService = inject(ContactService);

  contacts: Contact[] = [];
  editingId: string | null = null;

  formContact: Contact = {
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  };

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
      },
      error: () => {
        alert('Не удалось загрузить контакты');
      }
    });
  }

  saveContact(): void {
    if (
      !this.formContact.firstName ||
      !this.formContact.lastName ||
      !this.formContact.phone
    ) {
      alert('Заполните имя, фамилию и телефон');
      return;
    }

    if (this.editingId) {
      const updatedContact: Contact = {
        ...this.formContact,
        _id: this.editingId
      };

      this.contactService.updateContact(updatedContact).subscribe({
        next: () => {
          this.resetForm();
          this.loadContacts();
        },
        error: () => {
          alert('Не удалось изменить контакт');
        }
      });
    } else {
      this.contactService.addContact(this.formContact).subscribe({
        next: () => {
          this.resetForm();
          this.loadContacts();
        },
        error: () => {
          alert('Не удалось добавить контакт');
        }
      });
    }
  }

  editContact(contact: Contact): void {
    this.editingId = contact._id || null;

    this.formContact = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email
    };
  }

  deleteContact(contact: Contact): void {
    if (!contact._id) {
      return;
    }

    const confirmed = confirm(
      `Удалить контакт ${contact.firstName} ${contact.lastName}?`
    );

    if (!confirmed) {
      return;
    }

    this.contactService.deleteContact(contact._id).subscribe({
      next: () => {
        this.loadContacts();
      },
      error: () => {
        alert('Не удалось удалить контакт');
      }
    });
  }

  resetForm(): void {
    this.editingId = null;

    this.formContact = {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    };
  }
}