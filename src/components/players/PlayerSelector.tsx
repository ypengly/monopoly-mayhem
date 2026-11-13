import type { AIPersonality, TokenId } from '../../types';
import { PERSONALITIES, PERSONALITY_ORDER } from '../../data/gameRules';
import { TOKENS, TOKEN_ORDER } from '../../data/tokens';
import { TokenAvatar } from '../board/PlayerToken';
import { sound } from '../../utils/sound';

export interface SlotConfig {
  name: string;
  tokenId: TokenId;
  isAI: boolean;
  personality: AIPersonality;
}

interface Props {
  index: number;
  slot: SlotConfig;
  takenTokens: TokenId[];
  color: string;
  canToggleAI: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<SlotConfig>) => void;
  onRemove: () => void;
}

export default function PlayerSelector({ index, slot, takenTokens, color, canToggleAI, canRemove, onChange, onRemove }: Props) {
  return (
    <div className="toy-panel p-3" style={{ borderLeftWidth: 10, borderLeftColor: color }}>
      <div className="flex flex-wrap items-center gap-2">
        <TokenAvatar tokenId={slot.tokenId} size={48} ring={color} />
        <input
          aria-label={`Player ${index + 1} name`}
          value={slot.name}
          maxLength={14}
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1 rounded-full border-[3px] border-ink bg-white px-3 py-1.5 font-display text-base font-semibold outline-none focus:ring-4 focus:ring-candy-yellow"
        />
        {canToggleAI ? (
          <div className="flex overflow-hidden rounded-full border-[3px] border-ink text-sm font-bold" role="group" aria-label="Player type">
            <button
              type="button"
              aria-pressed={!slot.isAI}
              onClick={() => {
                sound.play('click');
                onChange({ isAI: false });
              }}
              className={`px-3 py-1 ${!slot.isAI ? 'bg-candy-green text-white' : 'bg-white'}`}
            >
              Human
            </button>
            <button
              type="button"
              aria-pressed={slot.isAI}
              onClick={() => {
                sound.play('click');
                onChange({ isAI: true });
              }}
              className={`px-3 py-1 ${slot.isAI ? 'bg-candy-blue text-white' : 'bg-white'}`}
            >
              Computer
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-ink/10 px-3 py-1 text-sm font-bold">{slot.isAI ? '🤖 Computer' : '🙂 Human'}</span>
        )}
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove player ${index + 1}`}
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-full border-[3px] border-ink bg-rose-100 font-bold text-rose-600 hover:bg-rose-200"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Character">
        {TOKEN_ORDER.map((id) => {
          const taken = takenTokens.includes(id) && id !== slot.tokenId;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={slot.tokenId === id}
              aria-label={TOKENS[id].name}
              title={taken ? `${TOKENS[id].name} (taken)` : TOKENS[id].name}
              disabled={taken}
              onClick={() => {
                sound.play('click');
                onChange({ tokenId: id });
              }}
              className={`rounded-full p-0.5 transition ${slot.tokenId === id ? 'scale-110 ring-4 ring-candy-yellow' : 'hover:scale-105'} ${taken ? 'opacity-30' : ''}`}
            >
              <TokenAvatar tokenId={id} size={36} />
            </button>
          );
        })}
      </div>

      {slot.isAI && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="AI personality">
          {PERSONALITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={slot.personality === p}
              title={PERSONALITIES[p].blurb}
              onClick={() => {
                sound.play('click');
                onChange({ personality: p });
              }}
              className={`rounded-full border-[3px] border-ink px-2.5 py-1 text-xs font-bold ${slot.personality === p ? 'bg-candy-yellow' : 'bg-white hover:bg-yellow-50'}`}
            >
              {PERSONALITIES[p].emoji} {PERSONALITIES[p].name}
            </button>
          ))}
          <p className="w-full text-xs font-semibold text-ink/60">{PERSONALITIES[slot.personality].blurb}</p>
        </div>
      )}
    </div>
  );
}
