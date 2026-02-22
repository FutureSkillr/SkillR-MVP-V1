CREATE TABLE journey_definitions (
    id TEXT PRIMARY KEY,
    journey_type journey_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    stations JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE station_definitions (
    id TEXT PRIMARY KEY,
    journey_id TEXT NOT NULL REFERENCES journey_definitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    vuca_dimension vuca_dimension,
    order_index INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_journey ON station_definitions(journey_id);
CREATE INDEX idx_stations_order ON station_definitions(journey_id, order_index);
