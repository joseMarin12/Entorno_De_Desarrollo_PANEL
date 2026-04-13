import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;

  beforeEach(async () => {
    TestBed.overrideComponent(ConfirmationModalComponent, {
      set: { template: '' }
    });

    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose default input values', () => {
    expect(component.name()).toBe('item');
    expect(component.title()).toBe('¿Seguro que quieres realizar esta acción?');
    expect(component.description()).toBeNull();
    expect(component.cancelarButtonTitle()).toBe('Cancelar');
    expect(component.desactivarButtonTitle()).toBe('Dar de baja');
    expect(component.activarButtonTitle()).toBe('Activar');
    expect(component.mode()).toBe('DESACTIVAR');
  });

  it('should compute isDesactivar as true when mode is DESACTIVAR', () => {
    fixture.componentRef.setInput('mode', 'DESACTIVAR');
    fixture.detectChanges();

    expect(component.isDesactivar()).toBeTrue();
  });

  it('should compute isDesactivar as false when mode is ACTIVAR', () => {
    fixture.componentRef.setInput('mode', 'ACTIVAR');
    fixture.detectChanges();

    expect(component.isDesactivar()).toBeFalse();
  });

  it('should emit confirm output', () => {
    let emitted = false;
    component.confirm.subscribe(() => {
      emitted = true;
    });

    component.confirm.emit();

    expect(emitted).toBeTrue();
  });
});
