import {
  BASE_SLOTS,
  CONVENIAR_SLOTS,
  type FileSlot,
} from "../files/slots";
import type { FileHandle } from "../files/types";
import { SlotDropzone } from "./Dropzone";

type FileSlotsProps = {
  files: FileHandle[];
  onSlotFile: (slotId: string, files: File[]) => void;
  onRemoveSlot: (slotId: string) => void;
};

function fileForSlot(files: FileHandle[], slot: FileSlot): FileHandle | null {
  return files.find((file) => file.slotId === slot.id) ?? null;
}

export function FileSlots({
  files,
  onSlotFile,
  onRemoveSlot,
}: FileSlotsProps) {
  return (
    <div className="slots">
      <section className="slot-group" aria-labelledby="slots-conveniar">
        <h2 id="slots-conveniar">Extratos Conveniar</h2>
        <p className="slot-lead">
          Um arquivo por instituto. Docentes e equipe é opcional, para excluir
          esses CPFs. Pode mandar só os IFs desta conferência.
        </p>
        <div className="slot-grid">
          {CONVENIAR_SLOTS.map((slot) => (
            <SlotDropzone
              key={slot.id}
              slot={slot}
              file={fileForSlot(files, slot)}
              onFile={(incoming) => onSlotFile(slot.id, incoming)}
              onRemove={() => onRemoveSlot(slot.id)}
            />
          ))}
        </div>
      </section>

      <section className="slot-group" aria-labelledby="slots-bases">
        <h2 id="slots-bases">Planilhas da conferência</h2>
        <p className="slot-lead">
          Cada espaço recebe um arquivo. Inscrições geral entra para localizar
          ID e edital dos CPFs ausentes.
        </p>
        <div className="slot-stack">
          {BASE_SLOTS.map((slot) => (
            <SlotDropzone
              key={slot.id}
              slot={slot}
              file={fileForSlot(files, slot)}
              onFile={(incoming) => onSlotFile(slot.id, incoming)}
              onRemove={() => onRemoveSlot(slot.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
