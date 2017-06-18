import deepEqual from 'deep-equal'
import promiseToTask from 'modules/promiseToTask'
import configInitialState from 'reducers/config.initial-state'
import sequencesInitialState from 'reducers/sequences.initial-state'
import instrumentsInitialState from 'utils/default-instruments'
import { getAllowedLengthsFromSequence } from './sequences'

const presets = [
    {
        id: 'meshuggah',
        description: 'Meshuggah',
        group: 'Artists',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.meshuggah" */ './presets/meshuggah')
        )
    },
    {
        id: 'sworn-in',
        description: 'Sworn In',
        group: 'Artists',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.sworn-in" */ './presets/sworn-in')
        )
    },
    {
        id: 'thall-buster',
        description: 'Scratchy heavy',
        group: 'Djent',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.thall-buster" */ './presets/thall-buster')
        )
    },
    {
        id: 'thall-chicken',
        description: 'Scratchy groovy',
        group: 'Djent',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.thall-chicken" */ './presets/thall-chicken')
        )
    },
    {
        id: 'thall',
        description: 'Thall',
        group: 'Djent',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.thall" */ './presets/thall')
        )
    },
    {
        id: 'thall-triplets',
        description: 'Thall (triplets)',
        group: 'Djent',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.thall-triplets" */ './presets/thall-triplets')
        )
    },
    {
        id: 'black-dahlia',
        description: 'Blast Beats',
        group: 'Heavy',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.black-dahlia" */ './presets/black-dahlia')
        )
    },
    {
        id: 'adtr',
        description: 'Breakdown',
        group: 'Pop Punk',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.adtr-breakdown" */ './presets/adtr-breakdown')
        )
    },
    {
        id: 'contortionist',
        description: 'Poly Chords & Melody',
        group: 'Progressive',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.contortionist" */ './presets/contortionist')
        )
    },
    {
        id: 'polyrhythms',
        description: 'Polyrhythms',
        group: 'Progressive',
        load: promiseToTask(() =>
            import(/* webpackChunkName: "presets.polyrhythms" */ './presets/polyrhythms')
        )
    },
]

const createPresetFactory = ({
    configInitialState: _configInitialState,
    instrumentsInitialState: _instrumentsInitialState,
    sequencesInitialState: _sequencesInitialState
}) =>
    ({ bpm, description, id, instruments, sequences, usePredefinedSettings }) => {
        const newPreset = {}
        const configObj = {}

        if (description) newPreset.description = description
        if (id) newPreset.id = id
        if (bpm && _configInitialState.bpm !== bpm) configObj.bpm = bpm

        const settingsObj = {
            ...(
                Object.keys(configObj).length
                    ? { config: configObj }
                    : {}
            ),
            ...(
                sequences && sequences.length && !deepEqual(sequences, _sequencesInitialState)
                    ? { sequences }
                    : {}
            ),
        }

        if (usePredefinedSettings) {
            settingsObj.instruments = instruments
                .map(instrument => ({
                    id: instrument.id,
                    pitch: instrument.pitch,
                    predefinedHitTypes: instrument.hitTypes,
                    predefinedSequence: instrument.sequence,
                    sequences: instrument.sequences,
                    volume: instrument.volume,
                    fadeOutDuration: instrument.fadeOutDuration,
                    repeatHitTypeForXBeat: instrument.repeatHitTypeForXBeat,
                }))
        } else if (instruments && instruments.length) {
            const newInstruments =  instruments
                .reduce((_newInstruments, instrument) => {
                    const originalInstrument = _instrumentsInitialState
                        .find(i => i.id === instrument.id)

                    if (!originalInstrument) return _newInstruments

                    const newInstrument = { id: instrument.id }
                    if (!deepEqual(instrument.sequences, originalInstrument.sequences)) {
                        newInstrument.sequences = instrument.sequences
                    }
                    if (!deepEqual(instrument.sounds, originalInstrument.sounds)) {
                        newInstrument.sounds = instrument.sounds
                            .reduce((newSounds, sound) => {
                                const originalSound = originalInstrument.sounds
                                    .find(s => s.id === sound.id)

                                if (!sound.amount) return newSounds
                                if (!originalSound) return [ ...newSounds, sound ]

                                const newSound = { id: sound.id }
                                if (sound.amount !== originalSound.amount) {
                                    newSound.amount = sound.amount
                                }

                                return [ ...newSounds, newSound]
                            }, [])
                    }
                    if (instrument.fadeOutDuration != null && instrument.fadeOutDuration !== originalInstrument.fadeOutDuration) {
                        newInstrument.fadeOutDuration = instrument.fadeOutDuration
                    }
                    if (instrument.ringout != null && instrument.ringout !== originalInstrument.ringout) {
                        newInstrument.ringout = instrument.ringout
                    }
                    if (instrument.pitch != null && instrument.pitch !== originalInstrument.pitch) {
                        newInstrument.pitch = instrument.pitch
                    }
                    if (instrument.volume != null && instrument.volume !== originalInstrument.volume) {
                        newInstrument.volume = instrument.volume
                    }
                    if (instrument.repeatHitTypeForXBeat != null && instrument.repeatHitTypeForXBeat !== originalInstrument.repeatHitTypeForXBeat) {
                        newInstrument.repeatHitTypeForXBeat = instrument.repeatHitTypeForXBeat
                    }

                    return [ ..._newInstruments, ...(Object.keys(newInstrument).length > 1 ? [newInstrument] : []) ]
                }, [])

            if (newInstruments.length) {
                settingsObj.instruments = newInstruments
            }
        }

        return {
            ...newPreset,
            ...(
                settingsObj && Object.keys(settingsObj).length
                    ? { settings: settingsObj }
                    : {}
            )
        }
    }

const createPreset = createPresetFactory({ configInitialState, instrumentsInitialState, sequencesInitialState })

const backwardsCompatibility = (preset, allowedLengths) => {
    if (preset.settings.beats && preset.settings.beats.length) {
        preset.settings.sequences = preset.settings.beats
    }

    if (preset.settings.sequences.find(seq => seq.id === 'groove')) {
        preset.settings.sequences = preset.settings.sequences
            .map((seq) => {
                if (seq.id === 'groove') {
                    seq.id = 'CUSTOM_SEQUENCE_1'
                    seq.hitChance = preset.settings.config.hitChance
                    seq.allowedLengths = getAllowedLengthsFromSequence(preset.settings.instruments.find(i => i.id === 'g').predefinedSequence, allowedLengths)
                }

                return seq
            })
    }
    return preset
}

export default presets

export {
    backwardsCompatibility,
    createPresetFactory,
    createPreset,
}
