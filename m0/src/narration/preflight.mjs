import {loadEnvFile} from 'node:process';

loadEnvFile('.env');
const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
if (!key || !voiceId) throw new Error('ElevenLabs key or selected voice ID is missing');

async function readOnly(path) {
  const response = await fetch(`https://api.elevenlabs.io/v1/${path}`, {
    method: 'GET',
    headers: {'xi-api-key': key},
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Read-only ${path.split('/')[0]} metadata returned HTTP ${response.status}`);
  return response.json();
}

const [subscription, voice, models] = await Promise.all([
  readOnly('user/subscription'),
  readOnly(`voices/${encodeURIComponent(voiceId)}`),
  readOnly('models'),
]);
const model = Array.isArray(models) ? models.find((item) => item.model_id === 'eleven_flash_v2_5') : undefined;
const selected = {
  subscription: {
    tier: subscription.tier,
    status: subscription.status,
    character_count: subscription.character_count,
    character_limit: subscription.character_limit,
    credit_count: subscription.credit_count,
    credit_limit: subscription.credit_limit,
    can_extend_character_limit: subscription.can_extend_character_limit,
  },
  voice: {
    name: voice.name,
    category: voice.category,
    labels: voice.labels,
    verified_languages: voice.verified_languages?.map((language) => language.language),
    high_quality_base_model_ids: voice.high_quality_base_model_ids,
    sharing: voice.sharing && {status: voice.sharing.status, category: voice.sharing.category, enabled_in_library: voice.sharing.enabled_in_library, free_users_allowed: voice.sharing.free_users_allowed},
    is_owner: voice.is_owner,
    is_legacy: voice.is_legacy,
  },
  model: model && {
    model_id: model.model_id,
    can_do_text_to_speech: model.can_do_text_to_speech,
    requires_alpha_access: model.requires_alpha_access,
    maximum_text_length_per_request: model.maximum_text_length_per_request,
    languages: model.languages?.map((language) => language.language_id),
    model_rates: model.model_rates,
  },
};
console.log(JSON.stringify(selected, null, 2));
