from pydantic import BaseModel, Field
from typing import List, Literal, Union

# Shared data structures
class Device(BaseModel):
    id: str
    name: str
    inputs: int
    outputs: int

class TFData(BaseModel):
    freqs: List[float]
    mag_db: List[float]
    phase_deg: List[float]
    coh: List[float]
    ir: List[float]

class SPLData(BaseModel):
    Leq: float
    LZ: float

WindowType = Literal["hann", "kaiser", "blackman"]
AvgType = Literal["power", "linear", "exp"]
LpfMode = Literal["lpf", "none"]

class CaptureConfig(BaseModel):
    deviceId: str
    sampleRate: int
    blockSize: int
    refChan: int
    measChan: int
    
    # FFT & Averaging
    nfft: int
    avg: AvgType
    avgCount: int
    window: WindowType

    # Smoothing
    lpfMode: LpfMode
    lpfFreq: float

# Message types from client to agent
class HelloMessage(BaseModel):
    type: Literal["hello"]
    client: str
    nonce: str

class ListDevicesMessage(BaseModel):
    type: Literal["list_devices"]

class StartCaptureMessage(CaptureConfig):
    type: Literal["start"]

class StopCaptureMessage(BaseModel):
    type: Literal["stop"]

class CalibrateMessage(BaseModel):
    type: Literal["calibrate"]
    spl_ref_db: float
    rms_dbfs: float

class GetVersionMessage(BaseModel):
    type: Literal["get_version"]

class FreezeDelayMessage(BaseModel):
    type: Literal["freeze_delay"]
    enabled: bool

class SetManualDelayMessage(BaseModel):
    type: Literal["set_manual_delay"]
    delay_ms: float | None = None

# Message types from agent to client
class HelloAckMessage(BaseModel):
    type: Literal["hello_ack"]
    agent: str
    originAllowed: bool

class DevicesMessage(BaseModel):
    type: Literal["devices"]
    items: List[Device]

class FrameMessage(BaseModel):
    type: Literal["frame"]
    tf: TFData
    spl: SPLData
    delay_ms: float
    latency_ms: float
    ts: int
    sampleRate: int
    delay_mode: str | None = None
    applied_delay_ms: float | None = None

class StoppedMessage(BaseModel):
    type: Literal["stopped"]

class ErrorMessage(BaseModel):
    type: Literal["error"]
    message: str
    code: str | None = None

class VersionMessage(BaseModel):
    type: Literal["version"]
    version: str
    build: str | None = None

class CalibrationDoneMessage(BaseModel):
    type: Literal["calibration_done"]
    slope: float
    offset: float

# Discriminated unions for parsing incoming messages
ClientMessage = Union[
    HelloMessage,
    ListDevicesMessage,
    StartCaptureMessage,
    StopCaptureMessage,
    CalibrateMessage,
    GetVersionMessage,
    FreezeDelayMessage,
    SetManualDelayMessage,
]

AgentMessage = Union[
    HelloAckMessage,
    DevicesMessage,
    FrameMessage,
    StoppedMessage,
    ErrorMessage,
    VersionMessage,
    CalibrationDoneMessage,
]

class IncomingMessage(BaseModel):
    message: ClientMessage = Field(..., discriminator="type")

class OutgoingMessage(BaseModel):
    message: AgentMessage = Field(..., discriminator="type")
