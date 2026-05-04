import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastroPacientePage } from './cadastro-paciente.page';

describe('CadastroPacientePage', () => {
  let component: CadastroPacientePage;
  let fixture: ComponentFixture<CadastroPacientePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CadastroPacientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
